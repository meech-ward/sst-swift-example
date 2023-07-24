#!/bin/bash

# File to store the process ID
pid_file="/tmp/aws-lambda-rie.pid"
swift package resolve
swift build
executable="$(swift build --show-bin-path)/$TARGET_NAME"

echo "$(pwd)"

# Check if the process is running
if [ -f "$pid_file" ] && kill -0 $(cat "$pid_file") > /dev/null 2>&1; then
    echo "Stopping aws-lambda-rie"
    kill -9 $(cat "$pid_file") && rm -f "$pid_file"
fi

echo "Starting aws-lambda-rie $executable"
/usr/bin/aws-lambda-rie $executable &

# Store the new PID
echo $! > "$pid_file"
