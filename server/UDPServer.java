import java.net.*;
import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import java.io.OutputStream;

public class UDPServer {
    private static final int UDP_PORT = 33333;
    private static final int HTTP_PORT = Integer.parseInt(System.getenv().getOrDefault("PORT", "10000"));

    public static void main(String[] args) throws Exception {
        // Start HTTP server for Render health checks
        startHTTPServer();
        
        // Start UDP server for chat
        startUDPServer();
    }
    
    private static void startHTTPServer() throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(HTTP_PORT), 0);
        server.createContext("/", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                String response = "UDP Chat Server Running!";
                exchange.sendResponseHeaders(200, response.length());
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(response.getBytes());
                }
            }
        });
        server.start();
        System.out.println("HTTP Server started on port " + HTTP_PORT);
    }
    
    private static void startUDPServer() throws Exception {
        System.out.println("Starting UDP Server on port " + UDP_PORT);
        DatagramSocket socket = new DatagramSocket(UDP_PORT);
        byte[] buffer = new byte[1024];

        while (true) {
            DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
            socket.receive(packet);
            socket.send(packet);
            System.out.println("Forwarded message of length: " + packet.getLength());
        }
    }
}