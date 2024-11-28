FROM openjdk:11-jre-slim

WORKDIR /app
COPY server/UDPServer.java .

RUN javac UDPServer.java

EXPOSE 33333/udp

CMD ["java", "UDPServer"]