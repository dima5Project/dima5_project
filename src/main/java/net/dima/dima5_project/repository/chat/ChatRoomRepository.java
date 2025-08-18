package net.dima.dima5_project.repository.chat;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import net.dima.dima5_project.domain.chat.ChatRoom;
import net.dima.dima5_project.domain.chat.ChatRoomStatus;
import net.dima.dima5_project.entity.PredictUserEntity;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
        Optional<ChatRoom> findFirstByUserAndStatusInOrderByLastMsgAtDesc(
                        PredictUserEntity user, List<ChatRoomStatus> statuses);

        Optional<ChatRoom> findFirstByGuestIdAndStatusInOrderByLastMsgAtDesc(
                        String guestId, List<ChatRoomStatus> statuses);

        List<ChatRoom> findByStatusOrderByLastMsgAtDesc(ChatRoomStatus status);
}
