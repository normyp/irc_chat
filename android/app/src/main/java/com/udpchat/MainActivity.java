package com.udpchat;

import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.os.Handler;
import android.os.Looper;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity implements UDPClient.MessageCallback {
    private TextView terminalOutput;
    private EditText messageInput;
    private UDPClient udpClient;
    private List<String> messages = new ArrayList<>();
    private Handler handler = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        terminalOutput = findViewById(R.id.terminalOutput);
        messageInput = findViewById(R.id.messageInput);
        Button sendButton = findViewById(R.id.sendButton);

        udpClient = new UDPClient(this);
        udpClient.start();

        sendButton.setOnClickListener(v -> {
            String message = messageInput.getText().toString().trim();
            if (!message.isEmpty()) {
                udpClient.sendMessage(message);
                messageInput.setText("");
            }
        });
    }

    @Override
    public void onMessageReceived(String message) {
        messages.add(message);
        updateTerminal();
        
        // Remove message after 5 seconds
        handler.postDelayed(() -> {
            messages.remove(message);
            updateTerminal();
        }, 5000);
    }

    private void updateTerminal() {
        StringBuilder display = new StringBuilder();
        for (String msg : messages) {
            display.append(msg).append("\n");
        }
        terminalOutput.setText(display.toString());
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        udpClient.stop();
    }
}