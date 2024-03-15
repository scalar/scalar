#!/bin/bash

function usage {
    echo "---Build and run examples---"
    echo ""
    echo " Arguments: "
    echo "    --method  = build|run|push|deploy"
    echo "    --project = gcp project id"
    echo "    --env     = staging|production"
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

name="nextjs-api-reference-example"
image_name="$name"

case "${method:?}" in
    build)
        docker build \
        -t ${image_name}:latest \
        -f ./examples/nextjs-api-reference/Dockerfile .
        ;;
    run)
        docker run \
        -p 3000:3000 \
        ${image_name}:latest
        ;;
    *)
        echo "Usage: $0 {build|run}"
        exit 1
esac

