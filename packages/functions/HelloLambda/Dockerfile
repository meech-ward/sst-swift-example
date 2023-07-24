FROM swift:5.8.1-amazonlinux2 as builder
# Default to debug build, can be overridden at build time with --build-arg build_type=release
ARG build_type=debug
ARG target_name=hello

# RUN yum -y install git jq tar zip openssl-devel
WORKDIR /code

RUN yum -y install git jq tar zip openssl-devel

# Resolve dependencies
COPY Package.swift .
RUN swift package resolve

# Build the package
ADD /Sources/ ./Sources/
RUN cd /code && swift build -c $build_type 
RUN cp $(swift build -c $build_type --show-bin-path)/$target_name /lambdaExec


# the image we will deploy to AWS Lambda
FROM swift:5.8.1-amazonlinux2-slim

COPY --from=builder /lambdaExec /lambdaExec
RUN chmod 755 /lambdaExec
CMD ["/lambdaExec"]
