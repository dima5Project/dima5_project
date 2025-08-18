package net.dima.dima5_project.domain.chat;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import net.dima.dima5_project.entity.PredictUserEntity;

@Entity
@Table(name = "chat_room")
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 로그인 유저면 user 사용, 비회원이면 guestId 사용
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private PredictUserEntity user;

    @Column(name = "guest_id", length = 64)
    private String guestId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ChatRoomStatus status = ChatRoomStatus.OPEN;

    // 담당 관리자(선택)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private PredictUserEntity assignee;

    @Column(name = "last_msg_at", nullable = false)
    private LocalDateTime lastMsgAt = LocalDateTime.now();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // --- getters/setters ---
    public Long getId() {
        return id;
    }

    public PredictUserEntity getUser() {
        return user;
    }

    public void setUser(PredictUserEntity user) {
        this.user = user;
    }

    public String getGuestId() {
        return guestId;
    }

    public void setGuestId(String guestId) {
        this.guestId = guestId;
    }

    public ChatRoomStatus getStatus() {
        return status;
    }

    public void setStatus(ChatRoomStatus status) {
        this.status = status;
    }

    public PredictUserEntity getAssignee() {
        return assignee;
    }

    public void setAssignee(PredictUserEntity assignee) {
        this.assignee = assignee;
    }

    public LocalDateTime getLastMsgAt() {
        return lastMsgAt;
    }

    public void setLastMsgAt(LocalDateTime lastMsgAt) {
        this.lastMsgAt = lastMsgAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
