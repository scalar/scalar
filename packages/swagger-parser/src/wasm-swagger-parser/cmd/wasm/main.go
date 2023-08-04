package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"syscall/js"

	"github.com/pb33f/libopenapi"
	"github.com/pb33f/libopenapi/datamodel"

	"github.com/ghodss/yaml"

	oj "gitlab.com/c0b/go-ordered-json"

	"github.com/getkin/kin-openapi/openapi2"
	"github.com/getkin/kin-openapi/openapi2conv"
)

type TagInfo struct {
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Operations  []Operation `json:"operations"`
}

type TagsInfoMap map[string]TagInfo

type Operation struct {
	Path        string           `json:"path"`
	Information *json.RawMessage `json:"information"`
	HttpVerb    string           `json:"httpVerb"`
	OperationId string           `json:"operationId"`
	Name        string           `json:"name"`
	Description string           `json:"description"`
}

type Payload struct {
	Tags         []TagInfo            `json:"tags"`
	Operations   map[string]Operation `json:"operations"`
	Info         *json.RawMessage     `json:"info"`
	ExternalDocs *json.RawMessage     `json:"externalDocs"`
	Servers      []*json.RawMessage   `json:"servers"`
}

type Spec struct {
	Paths *json.RawMessage `json:"paths"`
}

func handleV2(input string) (string, error) {
	var doc2 openapi2.T
	err := json.Unmarshal([]byte(input), &doc2)

	doc3, err := openapi2conv.ToV3(&doc2)

	if err != nil {
		return "", err
	}

	data, err := json.Marshal(doc3)

	if err != nil {

		return "", err
	}

	document, err := libopenapi.NewDocument(data)
	if err != nil {
		return "", err
	}

	return handleV3(document, string(data))
}

func handleV3(document libopenapi.Document, input string) (string, error) {
	model, errs := document.BuildV3Model()
	if len(errs) > 0 {
		resolvingError := errs[0]
		if resolvingError != nil {
			return "", resolvingError
		}
	}

	payload := Payload{}

	payload.Operations = make(map[string]Operation)

	tags := model.Model.Tags

	info, err := model.Model.Info.Render()
	if err == nil {
		ydata, err := yaml.YAMLToJSON(info)
		if err == nil {
			payload.Info = (*json.RawMessage)(&ydata)
		}
	}

	externalDocs, err := model.Model.ExternalDocs.Render()
	if err == nil {
		ydata, err := yaml.YAMLToJSON(externalDocs)
		if err == nil {
			payload.ExternalDocs = (*json.RawMessage)(&ydata)
		}
	}

	for _, server := range model.Model.Servers {
		serverRendered, err := server.Render()
		if err == nil {
			ydata, err := yaml.YAMLToJSON(serverRendered)
			if err == nil {
				payload.Servers = append(payload.Servers, (*json.RawMessage)(&ydata))
			}
		}
	}
	tagsInfoMap := make(TagsInfoMap)

	sortedTags := []TagInfo{}

	for _, tag := range tags {
		t := TagInfo{
			Name:        tag.Name,
			Description: tag.Description,
			Operations:  []Operation{},
		}
		tagsInfoMap[tag.Name] = t
		sortedTags = append(sortedTags, t)
	}

	spec := Spec{}

	var om *oj.OrderedMap = oj.NewOrderedMap()

	json.Unmarshal([]byte(input), &spec)
	// y, err := yaml.JSONToYAML([]byte(input))

	err = json.Unmarshal(*spec.Paths, om)

	pathOrder := []string{}
	iter := om.EntriesIter()
	for {
		pair, ok := iter()
		if !ok {
			break
		}
		pathOrder = append(pathOrder, pair.Key)
	}

	operationOrder := []string{
		"get",
		"post",
		"patch",
		"put",
		"delete",
		"options",
		"head",
		"trace",
		"links",
		"default",
	}

	// for key, path := range model.Model.Paths.PathItems {
	for _, key := range pathOrder {
		path := model.Model.Paths.PathItems[key]
		operations := path.GetOperations()

		for _, httpVerb := range operationOrder {
			if _, ok := operations[httpVerb]; ok {

				operation := operations[httpVerb]
				operationTags := operation.Tags

				// if an operation has no tags, we can append it to default
				if len(operationTags) == 0 {
					operationTags = []string{"default"}
				}

				for _, operationTag := range operationTags {
					opyaml, _ := operation.RenderInline()
					op, err := yaml.YAMLToJSON(opyaml)
					if err != nil {
						continue
					}
					if _, ok := tagsInfoMap[operationTag]; !ok {
						t := TagInfo{
							Name:        operationTag,
							Description: "",
							Operations:  []Operation{},
						}
						tagsInfoMap[operationTag] = t
						sortedTags = append(sortedTags, t)
					}
					ti := tagsInfoMap[operationTag]
					o := Operation{
						HttpVerb:    httpVerb,
						Path:        key,
						OperationId: operation.OperationId,
						Name:        operation.Summary,
						Description: operation.Description,
						Information: (*json.RawMessage)(&op),
					}
					ti.Operations = append(ti.Operations, o)

					// payload.Operations[operation.OperationId] = o
					tagsInfoMap[operationTag] = ti
				}
			}
		}
	}

	// if there are no defaults we remove them
	if val, ok := tagsInfoMap["default"]; ok {
		if len(val.Operations) == 0 {
			sortedTags = sortedTags[1:]
		}
	}
	for _, tag := range sortedTags {
		payload.Tags = append(payload.Tags, tagsInfoMap[tag.Name])
	}

	payloadString, _ := json.Marshal(payload)

	return string(payloadString), nil
}

func PrettyJson(input string) (string, error) {

	document, err := libopenapi.NewDocument([]byte(input))
	if err != nil {
		return "", err
	}

	info := document.GetSpecInfo()

	if info.SpecFormat == datamodel.OAS3 {
		return handleV3(document, input)
	} else if info.SpecFormat == datamodel.OAS2 {
		return handleV2(input)
	}

	return "", errors.New("Invalid spec format")
}

func jsonWrapper() js.Func {
	jsonfunc := js.FuncOf(func(this js.Value, args []js.Value) any {
		if len(args) != 1 {
			result := map[string]any{
				"error": "Invalid no of arguments passed",
			}
			return result
		}
		inputJSON := args[0].String()
		pretty, err := PrettyJson(inputJSON)
		if err != nil {
			errStr := fmt.Sprintf("unable to parse JSON. Error %s occurred\n", err)
			result := map[string]any{
				"error": errStr,
			}
			return result
		}
		return pretty
	})
	return jsonfunc
}

func main() {
	fmt.Println("Go Web Assembly")
	js.Global().Set("formatJSON", jsonWrapper())
	<-make(chan bool)
}
