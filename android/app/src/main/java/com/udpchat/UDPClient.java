package com.udpchat;

import android.os.Handler;
import android.os.Looper;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;

public class UDPClient {
    private static final int UDP_PORT = 33333;
    private static final String SERVER_IP = "https://irc-chat-z0bc.onrender.com";
    private DatagramSocket socket;
    private boolean running;
    private Handler handler;
    private MessageCallback callback;

    public interface MessageCallback {
        void onMessageReceived(String message);
    }

    public UDPClient(MessageCallback callback) {
        this.callback = callback;
        this.handler = new Handler(Looper.getMainLooper());
    }

    public void start() {
        running = true;
        new Thread(() -> {
            try {
                socket = new DatagramSocket();
                byte[] buffer = new byte[1024];

                while (running) {
                    DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
                    socket.receive(packet);
                    String message = new String(packet.getData(), 0, packet.getLength());
                    
                    handler.post(() -> callback.onMessageReceived(message));
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }).start();
    }

    public void sendMessage(String message) {
        new Thread(() -> {
            try {
                byte[] data = message.getBytes();
                InetAddress serverAddr = InetAddress.getByName(SERVER_IP);
                DatagramPacket packet = new DatagramPacket(
                    data, data.length, serverAddr, UDP_PORT
                );
                socket.send(packet);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }).start();
    }

    public void stop() {
        running = false;
        if (socket != null) {
            socket.close();
        }
    }
}