-- 2차 프로젝트 DB 구축
-- 25.07.28 MON

CREATE DATABASE IF NOT EXISTS `busam` DEFAULT CHARACTER SET UTF8MB3;
USE busam;

-- 생성: 부모테이블부터 / 삭제: 자식테이블부터

-- 1. 사용자 정보
DROP TABLE IF EXISTS predict_user;
CREATE TABLE IF NOT EXISTS predict_user
(
   user_seq    int        PRIMARY KEY AUTO_INCREMENT,
   user_name    varchar(100) NOT NULL,
   user_id    varchar(50)  UNIQUE,
   user_pwd    varchar(50)  NOT NULL,
   user_email    varchar(100) NOT NULL,
   user_type    varchar(100) CHECK (user_type IN ('화주','선사','항만사','일반 사용자')),
   user_role    varchar(50)  CHECK (user_role IN ('ROLE_USER', 'ROLE_ADMIN')) 
);

SELECT * FROM predict_user;

-- 3. 뉴스
DROP TABLE IF EXISTS news_board;
CREATE TABLE IF NOT EXISTS news_board
(
   news_seq int PRIMARY KEY AUTO_INCREMENT,
   publisher varchar(100) CHECK (publisher IN ('물류신문','한국무역협회', 'KOTRA')),
   news_title varchar(500) NOT NULL,
   register_date datetime DEFAULT CURRENT_TIMESTAMP,
   img_url varchar(1000) NOT NULL,
   news_url varchar(1000) NOT NULL   
);

SELECT * FROM news_board;

-- 4-1. 문의
DROP TABLE IF EXISTS ask_board;
CREATE TABLE IF NOT EXISTS ask_board
(
   ask_seq       int           PRIMARY KEY,
   ask_type      varchar(100)  DEFAULT '전체' CHECK (ask_type IN ('전체', '회원가입','서비스 이용', '기타')),
   ask_title     varchar(200)  NOT NULL,
   ask_content   varchar(5000) NOT NULL,
   ask_writer    varchar(50)   NOT NULL,
   create_date      datetime  DEFAULT CURRENT_TIMESTAMP,
   original_filename varchar(1000),
   saved_filename      varchar(1000),
   ask_pwd      int,
   reply_status boolean DEFAULT false,
      FOREIGN KEY (ask_writer) REFERENCES predict_user(user_id)
);

SELECT * FROM ask_board;

-- 4-2. 관리자답변
DROP TABLE IF EXISTS ask_reply;
CREATE TABLE IF NOT EXISTS ask_reply
(
   reply_num int PRIMARY KEY ,
   ask_title varchar(200) NOT NULL,
   reply_content varchar(5000) NOT NULL,
   reply_date datetime DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reply_num) REFERENCES ask_board(ask_seq)

);

SELECT * FROM ask_reply;


-- 5. 차항지 예측 (0)
DROP TABLE IF EXISTS port_predict;
CREATE TABLE IF NOT EXISTS port_predict
(
   predict_seq int               PRIMARY KEY AUTO_INCREMENT,
   port_id      varchar(10)       NOT NULL,
   cluster_num int               CHECK(cluster_num IN (0,1,2,3,4,5,6,7)),
   vessel_id   varchar(100)      NOT NULL,
   time_point  int CHECK(time_point IN (5, 8, 11, 14, 17, 20, 23, 26, 29)),
   time_stamp  datetime         NOT NULL,
   eta        datetime         NOT NULL,
   ata        datetime         NOT NULL,
   eta_error_hour decimal(5, 2)  NOT NULL,   
   lat        decimal(10, 6)    NOT NULL,
   lon        decimal(10, 6)    NOT NULL,
   cog        decimal(10, 2)    NOT NULL,
   heading     decimal(10, 2)    NOT NULL,
   top1_port   varchar(10)      NOT NULL,
   top1_prob   decimal(10, 2)    NOT NULL,
   top2_port   varchar(10)      NOT NULL,
   top2_prob   decimal(10, 2)      NOT NULL,
   top3_port   varchar(10)      NOT NULL,
   top3_prob   decimal(10, 2)      NOT NULL,
      FOREIGN KEY (port_id) REFERENCES port_info(port_id)   
);

SELECT * FROM port_predict;

-- 6-1. 항구명 (0)
DROP TABLE IF EXISTS port_name;
CREATE TABLE IF NOT EXISTS port_name
(
   port_id          varchar(10)  PRIMARY KEY NOT NULL,
   country_name_kr varchar(50)  NOT NULL,
   port_name_kr    varchar(50)  NOT NULL,
   country_name_en varchar(50)  NOT NULL,
   port_name_en    varchar(50)  NOT NULL,
   country_name_jp varchar(50)  NOT NULL,
   port_name_jp    varchar(50)  NOT NULL,
      FOREIGN KEY (port_id) REFERENCES port_info(port_id)
      
);

SELECT * FROM port_name;

-- 6-2. 항구정보 (0)
DROP TABLE IF EXISTS port_info;
CREATE TABLE IF NOT EXISTS port_info
(
   port_id varchar(10)    PRIMARY KEY,
   loc_lat decimal(10, 6) NOT NULL,
   loc_lon decimal(10, 6) NOT NULL

);

SELECT * FROM port_info;
-- DELETE FROM port_info;

-- 6-3. 항로
DROP TABLE IF EXISTS port_pso;
CREATE TABLE IF NOT EXISTS port_pso
(
   pso_seq int PRIMARY KEY AUTO_INCREMENT,
   port_id varchar(10) NOT NULL,
   pso_lat decimal(10, 6) NOT NULL,
   pso_lon decimal(10, 6) NOT NULL,
      FOREIGN KEY (port_id) REFERENCES port_info(port_id)
);

SELECT * FROM port_pso;


-- 6-4. 검색이력저장
DROP TABLE IF EXISTS predict_result_save;
CREATE TABLE IF NOT EXISTS predict_result_save
(
   result_seq   int PRIMARY KEY AUTO_INCREMENT,
   user_id      varchar(50) NOT NULL,
   vessel_alias varchar(200) NOT NULL,
   lat          decimal(10, 6) NOT NULL,
   lon          decimal(10, 6) NOT NULL,
   cog          decimal(10, 6) NOT NULL,
   heading      decimal(10, 6) NOT NULL,
   top1_port    varchar(10)    NOT NULL,
   top1_prob    decimal(10, 2) NOT NULL,
   eta          datetime NOT NULL,
      FOREIGN KEY (user_id) REFERENCES predict_user(user_id)
   
);
SELECT * FROM predict_result_save;
USE busam;
SHOW tables;
