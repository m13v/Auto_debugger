import subprocess

def main():
    # Call the e2b_test.py script
    process = subprocess.Popen(
        ["python3", "src/test/e2b_test.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    # Stream the output line by line
    for line in process.stdout:
        print(f"Parent received: {line}", end='')

    # Wait for the process to complete and get the return code
    process.wait()

if __name__ == "__main__":
    main()