#!/bin/bash

function usage {
    echo "---Build and run examples---"
    echo ""
    echo " Arguments: "
    echo "    --method  = build|run|push|build-local"
    echo "    --project = gcp project id"
    echo "    --package = package path"
}

# Parse arguments
while [ $# -gt 0 ]; do
    if [[ $1 == "--help" ]]; then
        usage
        exit 0
    elif [[ $1 == "--"* ]]; then
        v="${1/--/}"
        declare "$v"="$2"
        shift
    fi
    shift
done

# Move to the root of the project
cd ../..

repo="us-central1-docker.pkg.dev/${project:?}/oss-examples"
image="nextjs-api-reference-example"
image_name="$repo/$image"

case "${method:?}" in
    build-local)
        docker build \
        -t ${image_name} \
        -f ./examples/nextjs-api-reference/Dockerfile .
        ;;
    build)
        docker build \
        --platform=linux/amd64 \
        -t ${image_name} \
        -f ./examples/nextjs-api-reference/Dockerfile .
        ;;
    push)
        docker push ${image_name}
        ;;
    run)
        docker run \
        -p 8080:8080 \
        ${image_name}
        ;;
    *)
        echo "Usage: $0 {build|run}"
        exit 1
esac

