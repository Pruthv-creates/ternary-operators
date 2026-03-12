do you know exalidraw? the dashboard/investigation canvas of our app is kind of like that but not in the way you think, but in the way of, 3. Conflict Resolution: Versioning & Tombstoning
Since multiple people can edit the same shape simultaneously, Excalidraw uses a decentralized merging strategy:

Version Numbers: Every element (rectangle, arrow, text) has a version integer. When you move an object, your client increments its version.

Version Nonce: If two people edit the same object at the exact same time (resulting in the same version number), the client compares a random versionNonce. The lower nonce "wins," ensuring all clients eventually converge on the same visual state.

Tombstoning: To delete an object, the client doesn't actually remove it from the data array (which could cause it to reappear if a late-syncing peer sends an old state). Instead, it sets an isDeleted: true flag. 1. The "Collaborator" State
Instead of treating a cursor like a drawing object (which would be saved to the scene), Excalidraw treats it as a piece of volatile metadata. Each client maintains a collaborators object in its local state.

Data Structure: This object typically contains the user's pointer (x, y coordinates), their selectedElementIds, their username, and a color assigned to them.

Throttle & Debounce: To prevent overwhelming the network, the browser doesn't send a message for every single pixel the mouse moves. Instead, it throttles the updates (e.g., sending the position every 30–50ms).

2. The Broadcast Mechanism
When your mouse moves, your client sends a specific "mouse move" event to the excalidraw-room server.

Client A moves their mouse.

Socket.io sends a message: {"type": "MOUSE_MOVE", "payload": {"x": 100, "y": 200, "name": "Shreyas"}}.

The Relay Server immediately broadcasts this to all other users in the room.

Client B receives the message and updates its local React state for "User A".

3. Client-Side Rendering (The "Ghost" Layer)
Excalidraw renders these cursors on a separate layer from the main drawing canvas.

Overlay Layer: Because the drawing canvas only needs to re-render when a shape changes, the cursors are often rendered as absolute-positioned HTML elements or on a secondary "top-level" canvas. This prevents the entire drawing from having to re-calculate every time someone moves their mouse.

Interpolation: To make the movement look fluid (instead of "teleporting" every 50ms), some implementations use CSS transitions or linear interpolation (lerp) to smooth out the movement between the last known coordinate and the new one.

4. Handling "Ghost" Cursors (Timeouts)
Since the server is just a "dumb" relay, it doesn't always know if a user closed their tab instantly. To prevent names from getting stuck on the screen:

Heartbeats: If a client doesn't send a pointer update or a "heartbeat" within a few seconds, other clients automatically remove that user from their collaborators list.

Disconnect Event: Socket.io's built-in disconnect event on the server triggers a final broadcast to let everyone know "User X has left," so their cursor is removed immediately.
