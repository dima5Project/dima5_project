// package: net.dima.dima5_project.service.chat
package net.dima.dima5_project.service.chat;

import java.security.Principal;
import java.util.List;

import net.dima.dima5_project.dto.chat.ChatMsgDTO;
import net.dima.dima5_project.dto.chat.ChatRoomDTO;

public interface ChatService {

    ChatRoomDTO openOrReuseRoom(Principal principal, String guestId);

    ChatMsgDTO saveMessage(Long roomId, Principal principal, String content);

    void markRead(Long roomId, Principal principal);

    List<ChatMsgDTO> getHistory(Long roomId, int page, int size, Principal principal);

    List<ChatRoomDTO> listRooms(String status, int limit);

    ChatRoomDTO getRoomSummary(Long roomId);

    void assign(Long roomId, Principal admin);

    void close(Long roomId);

    long unreadForAdmin(Long roomId);
}
