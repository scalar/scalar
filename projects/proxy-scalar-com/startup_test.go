package main

import (
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"os/exec"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

// Run the real entry point in a child so environment settings and socket binding
// are exercised together, without changing the test process's global server.
func TestProxyStartupProcess(t *testing.T) {
	if os.Getenv("SCALAR_PROXY_STARTUP_TEST") != "1" {
		t.Skip("subprocess only")
	}
	main()
}

func startProxyProcess(t *testing.T, environment, allowPrivate string) string {
	t.Helper()
	listener, err := net.Listen("tcp4", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	_, port, _ := net.SplitHostPort(listener.Addr().String())
	listener.Close()
	command := exec.Command(os.Args[0], "-test.run=^TestProxyStartupProcess$")
	for _, entry := range os.Environ() {
		if !strings.HasPrefix(entry, "ENV=") && !strings.HasPrefix(entry, "PORT=") && !strings.HasPrefix(entry, "ALLOW_PRIVATE_ADDRESSES=") && !strings.HasPrefix(entry, "SCALAR_PROXY_STARTUP_TEST=") {
			command.Env = append(command.Env, entry)
		}
	}
	command.Env = append(command.Env, "SCALAR_PROXY_STARTUP_TEST=1", "ENV="+environment, "PORT="+port, "ALLOW_PRIVATE_ADDRESSES="+allowPrivate)
	if err := command.Start(); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { command.Process.Kill(); command.Wait() })
	address := "127.0.0.1:" + port
	client := &http.Client{Timeout: 100 * time.Millisecond, Transport: &http.Transport{Proxy: nil, DisableKeepAlives: true}}
	deadline := time.Now().Add(5 * time.Second)
	for time.Now().Before(deadline) {
		response, err := client.Get("http://" + address + "/ping")
		if err == nil {
			response.Body.Close()
			return address
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatal("proxy subprocess did not start")
	return ""
}

func TestDevModeKeepsPrivateAddressesBlocked(t *testing.T) {
	var calls atomic.Int64
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { calls.Add(1); io.WriteString(w, "private service") }))
	defer upstream.Close()
	address := startProxyProcess(t, "dev", "")
	response, err := http.Get("http://" + address + "/?scalar_url=" + url.QueryEscape(upstream.URL))
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusForbidden {
		t.Errorf("got status %d, want private target forbidden", response.StatusCode)
	}
	if calls.Load() != 0 {
		t.Errorf("dev mode contacted private upstream %d times", calls.Load())
	}
}

func TestProxyStartupBinding(t *testing.T) {
	addresses, err := net.InterfaceAddrs()
	if err != nil {
		t.Fatal(err)
	}
	var networkIP net.IP
	for _, address := range addresses {
		if network, ok := address.(*net.IPNet); ok && !network.IP.IsLoopback() && network.IP.To4() != nil {
			networkIP = network.IP
			break
		}
	}
	if networkIP == nil {
		t.Skip("no non-loopback IPv4 interface")
	}
	for _, tc := range []struct {
		name, environment, allowPrivate string
		external                        bool
	}{
		{name: "development", environment: "dev"},
		{name: "development private opt-in", environment: "dev", allowPrivate: "true"},
		{name: "production", external: true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			address := startProxyProcess(t, tc.environment, tc.allowPrivate)
			_, port, _ := net.SplitHostPort(address)
			connection, err := net.DialTimeout("tcp4", net.JoinHostPort(networkIP.String(), port), time.Second)
			if connection != nil {
				connection.Close()
			}
			if tc.external && err != nil {
				t.Fatalf("production listener is not reachable on the network interface: %v", err)
			}
			if !tc.external && err == nil {
				t.Fatal("dev proxy accepted a connection outside 127.0.0.1")
			}
		})
	}
}

func TestPrivateAddressAccessRequiresExplicitOptIn(t *testing.T) {
	for _, tc := range []struct {
		name, environment, allowPrivate string
		allowed                         bool
	}{
		{name: "development opt-in", environment: "dev", allowPrivate: "true", allowed: true},
		{name: "development false", environment: "dev", allowPrivate: "false"},
		{name: "development invalid flag", environment: "dev", allowPrivate: "1"},
		{name: "production default"},
		{name: "production opt-in", allowPrivate: "true", allowed: true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			var calls atomic.Int64
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { calls.Add(1); io.WriteString(w, "private service") }))
			defer upstream.Close()
			address := startProxyProcess(t, tc.environment, tc.allowPrivate)
			response, err := http.Get("http://" + address + "/?scalar_url=" + url.QueryEscape(upstream.URL))
			if err != nil {
				t.Fatal(err)
			}
			defer response.Body.Close()
			body, err := io.ReadAll(response.Body)
			if err != nil {
				t.Fatal(err)
			}
			if tc.allowed {
				if response.StatusCode != http.StatusOK || string(body) != "private service" || calls.Load() != 1 {
					t.Fatalf("opt-in did not forward exactly once: status=%d body=%q calls=%d", response.StatusCode, body, calls.Load())
				}
			} else if response.StatusCode != http.StatusForbidden || calls.Load() != 0 {
				t.Fatalf("private target was not blocked: status=%d calls=%d", response.StatusCode, calls.Load())
			}
		})
	}
}
