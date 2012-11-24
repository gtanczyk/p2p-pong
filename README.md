Peer to peer pong
==================

**Demo: http://gamedevpl.github.com/warsztat-game-demo/libs/test_main.html**

An attempt of implementing simple game using tools such as:
- JavaScript
- Websockets
- CSS3
- Java
* Java-WebSocket: https://github.com/TooTallNate/Java-WebSocket
* Jetty 7.6.7: http://download.eclipse.org/jetty/
- Dojo Toolkit 1.7

The idea was to show that it is possible to implement pseudo peer to peer communication in a browser based game.

= Architecture =

Simple program written in Java, it serves static files and exchanges messages between game clients.

Websockets server assigns unique IDs to clients and also decides whether some client is a game host or not.

Game host broadcast informations to other game clients(including himself). Clients receive full snapshot of game world data and all futher calculations are based on latest snapshot until more recent snapshot arrives.

TODO:
- snapshot checksums
- time sync between clients

= Gameplay =

The game is based on classic Pong game, however it allows more than two players, each taking one spot in some convex polygon, where number of edges equals to number of players.

Each player must not allow any ball to hit his edge, he should hit the ball with his paddle instead.

= How to run in Eclipse =

1. Download source code and create project
2. Add Jetty 7.6.7 to User Libraries
3. Add Jetty to build Path
4. Run ProxyServer
5. Type http://localhost:1750 in browser

Optional ProxyServer parameters:
[hostname] [socketport] [httpport]

Defaults: localhost 10123 1750