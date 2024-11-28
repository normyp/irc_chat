FROM openjdk:11-jdk

WORKDIR /app

# Copy the Java file
COPY server/UDPServer.java .

# Compile it
RUN javac UDPServer.java

# Expose ports
EXPOSE 10000
EXPOSE 33333/udp

# Set environment variable
ENV PORT=10000

# Run the server
ENTRYPOINT ["java", "UDPServer"]