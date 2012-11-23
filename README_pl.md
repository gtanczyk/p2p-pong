Peer to peer pong
==================

**Demo: http://gamedevpl.github.com/warsztat-game-demo/libs/test_main.html**

Próbna implementacja pomysłu na Warsztat game z użyciem następujących technologii:
- JavaScript
- Websockets
- CSS3
- Java
* Java-WebSocket: https://github.com/TooTallNate/Java-WebSocket
* Jetty 7.6.7: http://download.eclipse.org/jetty/
- Dojo Toolkit 1.7

Celem jest zaprezentowanie możliwości technicznych rozwiązania, które polega na tym, że jeden z graczy będzie pełnił funkcję autorytatywnego serwera dla pozostałych graczy.

= Architektura =

Prosty programik napisany w Javie serwuje pliki statyczne, a także wymienia informacje pomiędzy klientami.

Serwer socketów nadaje klientom identyfikatory, a także decyduje o tym, który z klientów jest hostem gry.

Host gry wysyła do klientów snapshot stanu gry, w którym znajdują się informacje o graczach, informacje o obiektach, planszy, punktacja i log z przebiegu rozgrywki.

Klient na bazie ostatniego snapshotu prowadzi włąsną symulację gry, ale po otrzymaniu nowego snapshota w pełni dostosowuje stan gry po stronie klienta do tego po stronie serwera.

Pomysły:
- sumy kontrolne snapshotów
- synchronizacja czasu pomiędzy klientami

= Gameplay =

Gra to najprostszy pong dla wielu graczy. Gra toczy się wewnątrz wielokąta:
- prostokąt dla dwóch graczy
- trójkąt dla trzech
- prostokąt dla czterech
- pięciokąt dla pięciu
- sześciokąt dla sześci itd.

Celem gracza jest nieprzepuszczanie piłki przez swój bok.

= Jak uruchomić w Eclipse =
1. Pobierz źródła
2. Dodaj do User Libraries Jetty 7.6.7
3. Dodaj bibliotekę Jetty do build path
4. Uruchom klasę ProxyServer
5. W przeglądarce otwórz adres: http://localhost:1750

Opcjonalne parametry ProxyServer to:
[hostname] [socketport] [httpport]

Domyślne wartości: localhost 10123 1750