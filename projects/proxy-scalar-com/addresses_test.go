package main

import (
	"context"
	"net"
	"strings"
	"testing"
)

func TestLocalNAT64Addresses(t *testing.T) {
	// RFC 6052 permits multiple IPv4 offsets. Block the entire RFC 8215 local
	// translation prefix rather than interpreting every address as a /96.
	for _, address := range []string{
		"64:ff9b:1:0:c0:a801:100:0", // /64 translation of 192.168.1.1
		"64:ff9b:1::a9fe:a9fe",      // /96 translation of metadata address
		"64:ff9b:1::808:808",        // public destinations in the local-use prefix also blocked
	} {
		t.Run(address, func(t *testing.T) {
			if !ipIsBlocked(net.ParseIP(address)) {
				t.Error("local translation address allowed")
			}
			proxy := NewProxyServer(false)
			remote := "http://" + net.JoinHostPort(address, "80")
			if _, errors := proxy.validateScalarURL(remote); len(errors) == 0 {
				t.Error("URL validation accepted local translation address")
			}
			if _, err := proxy.transport.DialContext(context.Background(), "tcp", net.JoinHostPort(address, "80")); err == nil || !strings.Contains(err.Error(), "blocked") {
				t.Errorf("dial did not block translation address: %v", err)
			}
		})
	}
	// Sharing the first 32 bits does not make an address part of 64:ff9b::/96.
	if embedded := embeddedIPv4s(net.ParseIP("64:ff9b:2::c0a8:101")); len(embedded) != 0 {
		t.Errorf("decoded unrelated prefix: %v", embedded)
	}
}
