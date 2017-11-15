DOCKER_IMAGE_VERSION=1.0
DOCKER_IMAGE_NAME=cmmc/netpie-auth
DOCKER_IMAGE_TAGNAME=$(DOCKER_IMAGE_NAME):$(DOCKER_IMAGE_VERSION)

default: build

build:
	docker build -t $(DOCKER_IMAGE_TAGNAME) . --no-cache
	docker tag  $(DOCKER_IMAGE_TAGNAME) $(DOCKER_IMAGE_NAME):latest

push:
	docker push $(DOCKER_IMAGE_NAME)

test:
	#docker run --rm $(DOCKER_IMAGE_TAGNAME) /bin/echo "Success."
	docker run --rm -it cmmc/netpie-auth netpie-auth --help

rmi:
	docker rmi -f $(DOCKER_IMAGE_TAGNAME)

rebuild: rmi build
