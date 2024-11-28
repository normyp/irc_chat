FROM openjdk:11-jre-slim

WORKDIR /app

# Copy the Java file
COPY server/UDPServer.java .

# Compile it
RUN javac UDPServer.java

# Expose UDP port
EXPOSE 33333/udp

# Set environment variable
ENV PORT=33333

# Run the server
ENTRYPOINT ["java", "UDPServer"]