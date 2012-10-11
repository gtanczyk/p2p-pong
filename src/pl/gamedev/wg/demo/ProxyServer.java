package pl.gamedev.wg.demo;

import java.net.InetSocketAddress;

import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.ResourceHandler;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

public class ProxyServer {

	public static void main(String[] args) throws Exception {
		String serverHost = args != null && args[0] != null ? args[0] : "localhost";  
		int serverSocketPort = args[1] != null ? Integer.parseInt(args[1]) : 10123;
		int serverHttpPort = args[2] != null ? Integer.parseInt(args[2]) : 1750;
		
		
		WebSocketServer socketServer = new WebSocketServer(new InetSocketAddress(serverHost, serverSocketPort)) {

			@Override
			public void onOpen(WebSocket conn, ClientHandshake handshake) {
				// TODO Auto-generated method stub

			}

			@Override
			public void onMessage(WebSocket conn, String message) {
				// TODO Auto-generated method stub

			}

			@Override
			public void onError(WebSocket conn, Exception ex) {
				// TODO Auto-generated method stub

			}

			@Override
			public void onClose(WebSocket conn, int code, String reason, boolean remote) {
				// TODO Auto-generated method stub

			}
		};

		Server httpServer = new Server(new InetSocketAddress(serverHost, serverHttpPort));
		ResourceHandler resources = new ResourceHandler();
		resources.setDirectoriesListed(false);
        resources.setWelcomeFiles(new String[]{ "index.html" });
		resources.setResourceBase("./lib");
		httpServer.setHandler(resources);
		httpServer.start();
		httpServer.join();
	}
}
