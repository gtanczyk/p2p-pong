package pl.gamedev.wg.demo;

import java.net.InetSocketAddress;
import java.util.Vector;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicLong;

import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.ResourceHandler;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

public class ProxyServer {

	public static void main(String[] args) throws Exception {
		String serverHost = args != null && args.length > 0 && args[0] != null ? args[0] : "localhost";
		int serverSocketPort = args != null && args.length > 1 && args[1] != null ? Integer.parseInt(args[1]) : 10123;
		int serverHttpPort = args != null && args.length > 2 && args[2] != null ? Integer.parseInt(args[2]) : 1750;

		final ConcurrentLinkedQueue<WebSocket> clients = new ConcurrentLinkedQueue<WebSocket>();
		final ConcurrentHashMap<Long, WebSocket> clientIDRev = new ConcurrentHashMap<Long, WebSocket>();
		final ConcurrentHashMap<WebSocket, Long> clientID = new ConcurrentHashMap<WebSocket, Long>() {
			public Long put(WebSocket key, Long value) {
				super.put(key, value);
				clientIDRev.put(value, key);
				return value;
			};
		};
		final AtomicLong hostID = new AtomicLong(0);

		WebSocketServer socketServer = new WebSocketServer(new InetSocketAddress(serverHost, serverSocketPort)) {

			@Override
			public void onOpen(WebSocket conn, ClientHandshake handshake) {
				clients.add(conn);
				clientID.put(conn, System.currentTimeMillis());
				if (hostID.get() == 0) {
					hostID.set(clientID.get(conn));
					conn.send("host:");
				} else
					conn.send("client:");
			}

			@Override
			public void onMessage(WebSocket conn, String message) {
				java.lang.System.out.println(message);
				long id = clientID.get(conn);
				boolean isHost = hostID.get() == id;
				String header = message.substring(0, message.indexOf(':'));
				String body = message.substring(message.indexOf(':') + 1);
				if (header.equals("host"))
					clientIDRev.get(hostID.get()).send(id + ":" + body);
				if (isHost && header.matches("^([0-9]+)$")) {
					long targetID = Long.parseLong(header);
					clientIDRev.get(targetID).send(body);
				} else if (isHost && header.equals("*")) {
					for (WebSocket client : clients) {
						client.send(body);
					}
				}
			}

			@Override
			public void onError(WebSocket conn, Exception ex) {
				if (conn != null && clientID.containsKey(conn)) {
					long id = clientID.get(conn);
					if (hostID.get() == id)
						hostID.set(0);
				}
				ex.printStackTrace();
			}

			@Override
			public void onClose(WebSocket conn, int code, String reason, boolean remote) {
				long id = clientID.get(conn);
				clients.remove(conn);
				if (hostID.get() == id) {
					hostID.set(0);
					if (clients.size() > 0) {
						WebSocket newHost = clients.element();
						hostID.set(clientID.get(newHost));
						newHost.send("host:");
					}
				}
				if (clientIDRev.get(hostID.get()) != null)
					clientIDRev.get(hostID.get()).send(id + ":leave");
			}
		};

		socketServer.start();

		Server httpServer = new Server(new InetSocketAddress(serverHost, serverHttpPort));
		ResourceHandler resources = new ResourceHandler();
		resources.setDirectoriesListed(false);
		resources.setWelcomeFiles(new String[] { "index.html" });
		resources.setResourceBase("./lib");
		httpServer.setHandler(resources);
		httpServer.start();
		httpServer.join();
	}
}
