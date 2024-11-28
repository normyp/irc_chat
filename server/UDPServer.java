import java.net.*;

public class UDPServer {
    private static final int PORT = 33333;

    public static void main(String[] args) throws Exception {
        System.out.println("Starting UDP Server on port " + PORT);
        DatagramSocket socket = new DatagramSocket(PORT);
        byte[] buffer = new byte[1024];

        while (true) {
            // Receive packet
            DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
            socket.receive(packet);
            
            // Just broadcast it back out
            socket.send(packet);
        }
    }
}