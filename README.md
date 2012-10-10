warsztat-game-demo
==================

Próbna implementacja pomysłu na Warsztat game z użyciem następujących technologii:
- Vanilla JS
- Websockets
- CSS3
- Java
* Java-WebSocket: https://github.com/TooTallNate/Java-WebSocket
* Jetty: http://jetty.codehaus.org/jetty/
- Gimp 2.0

Celem jest zaprezentowanie możliwości technicznych rozwiązania, które polega na tym, że jeden z graczy będzie pełnił funkcję autorytatywnego serwera dla pozostałych graczy.

= Gameplay:

Gra to najprostszy pong dla wielu graczy. Gra toczy się wewnątrz wielokąta:
- prostokąt dla dwóch graczy
- trójkąt dla trzech
- prostokąt dla czterech
- pięciokąt dla pięciu
- sześciokąt dla sześci itd.

Celem gracza jest nieprzepuszczanie piłki przez swój bok.