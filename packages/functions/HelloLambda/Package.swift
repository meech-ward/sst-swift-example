// swift-tools-version: 5.8
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "HelloLambda",
    platforms: [
        .macOS(.v13),
    ],
    products: [
        .executable(name: "HelloLambda", targets: ["HelloLambda"]),
    ],
    dependencies: [
        .package(url: "https://github.com/swift-server/swift-aws-lambda-runtime.git", branch: "main"),
        .package(url: "https://github.com/swift-server/swift-aws-lambda-events.git", branch: "main"),
        // .package(url: "https://github.com/awslabs/aws-sdk-swift", branch: "main"),
    ],
    targets: [
        // Targets are the basic building blocks of a package, defining a module or a test suite.
        // Targets can depend on other targets in this package and products from dependencies.
        .executableTarget(
            name: "HelloLambda",
            dependencies: [
                .product(name: "AWSLambdaRuntime", package: "swift-aws-lambda-runtime"),
                .product(name: "AWSLambdaEvents", package: "swift-aws-lambda-events"),
                // .product(name: "AWSDynamoDB", package: "aws-sdk-swift"),
                // .product(name: "AWSS3", package: "aws-sdk-swift"),
            ], path: "Sources"
        ),
    ]
)
