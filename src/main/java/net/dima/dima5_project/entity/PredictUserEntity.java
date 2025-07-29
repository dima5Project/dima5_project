package net.dima.dima5_project.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "predict_user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictUserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_seq")
    private Integer userSeq;

    @Column(name = "user_name")
    private String userName;

    @Column(name = "user_id", unique = true)
    private String userId;

    @Column(name = "user_pwd")
    private String userPwd;

    @Column(name = "user_email")
    private String userEmail;

    @Column(name = "user_type")
    private String userType;

    @Column(name = "user_role")
    private String userRole;
}
