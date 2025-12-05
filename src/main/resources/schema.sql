-- 1. 사용자 정보
DROP TABLE IF EXISTS predict_user;
CREATE TABLE IF NOT EXISTS predict_user
(
   user_seq    bigint        PRIMARY KEY AUTO_INCREMENT,
   user_name    varchar(100) NOT NULL,
   user_id    varchar(50)  UNIQUE,
   user_pwd    varchar(100)  NOT NULL,
   user_email    varchar(100) NOT NULL,
   user_type    varchar(100) CHECK (user_type IN ('화주','선사','항만사','일반 사용자')),
   user_role    varchar(50)  CHECK (user_role IN ('ROLE_USER', 'ROLE_ADMIN')) 
);

SELECT * FROM predict_user;
DELETE FROM predict_user 
WHERE user_id = 'admin';

-- INSERT INTO predict_user (user_name, user_id, user_pwd, user_email, user_type, user_role)
-- VALUES (
--    '관리자',
--    'admin',
--    '$2b$12$egE6vgtDweVhHfPI1OJcOu61Jg4jnryc.W0NvxyTqt2nWr0HZ6OrS',
--    'admin@example.com',
--    '일반 사용자',
--    'ROLE_ADMIN'
-- );

SELECT * FROM predict_user WHERE user_id = 'admin';

ALTER TABLE predict_user ADD COLUMN join_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 1) 길이 늘리기 (MySQL)
ALTER TABLE predict_user
MODIFY COLUMN user_pwd VARCHAR(100) NOT NULL;

SELECT user_id, LENGTH(user_pwd) AS len, user_pwd
FROM predict_user
WHERE user_id='admin';

-- 2. 뉴스 (0)
DROP TABLE IF EXISTS news_board;
CREATE TABLE IF NOT EXISTS news_board
(
   news_seq int PRIMARY KEY AUTO_INCREMENT,
   publisher varchar(100) NOT NULL ,
   news_title varchar(1000) NOT NULL,
   register_date date NOT NULL,
   img_url varchar(1000) NOT NULL,
   news_url varchar(1000) NOT NULL   
);

SELECT * FROM news_board;
DELETE FROM news_board;
COMMIT;

-- 3. 문의
DROP TABLE IF EXISTS ask_board;
CREATE TABLE IF NOT EXISTS ask_board
(
   ask_seq       bigint       PRIMARY key auto_increment,
   ask_type      varchar(100)  DEFAULT '전체' CHECK (ask_type IN ('전체', '로그인','서비스 이용', '기타')),
   ask_title     varchar(200)  NOT NULL,
   ask_content   varchar(5000) NOT NULL,
   ask_writer    varchar(50)   NOT NULL,
   create_date      datetime  DEFAULT CURRENT_TIMESTAMP,
   original_filename varchar(1000),
   saved_filename      varchar(1000),
   ask_pwd      varchar(10),
   reply_status boolean DEFAULT false,
      FOREIGN KEY (ask_writer) REFERENCES predict_user(user_id)
);


SELECT * FROM ask_board;
commit;
DELETE FROM ask_board WHERE ask_seq = 27;

-- 4. 관리자답변
DROP TABLE IF EXISTS ask_reply;
CREATE TABLE IF NOT EXISTS ask_reply
(
   reply_num bigint PRIMARY key auto_increment,
   ask_title varchar(200) NOT NULL,
   reply_content varchar(5000) NOT NULL,
   reply_date datetime DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reply_num) REFERENCES ask_board(ask_seq)
);

SELECT * FROM ask_reply;
COMMIT;

DELETE FROM ask_reply WHERE reply_num = 27;

-- 5. 항구정보 (0)
-- DROP TABLE IF EXISTS port_info;
CREATE TABLE IF NOT EXISTS port_info
(
   port_id varchar(10)    PRIMARY KEY,
   loc_lat decimal(15, 10) NOT NULL,
   loc_lon decimal(15, 10) NOT NULL
);

SELECT * FROM port_info;
commit;
-- DELETE FROM port_info;


-- 6. 항구명 (0) (port_info 부터 생성)
-- DROP TABLE IF EXISTS port_name;
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

COMMIT;
SELECT * FROM port_name;
-- DELETE FROM port_name;


-- 7. 부가정보
DROP TABLE IF EXISTS port_docking;
CREATE TABLE IF NOT EXISTS port_docking (
    docking_id int AUTO_INCREMENT PRIMARY KEY,
    time_stamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    port_id VARCHAR(10) NOT NULL,
    expected_ships int,
    current_ships int,
       FOREIGN KEY (port_id) REFERENCES port_info(port_id)
);
commit;
select * from port_docking;

-- 8. 국가별 공휴일
DROP TABLE IF EXISTS port_holiday;
CREATE TABLE IF NOT EXISTS port_holiday(
   holiday_seq int AUTO_INCREMENT PRIMARY KEY,
    holiday_date DATE NOT NULL,
    country_name_kr varchar(50) NOT NULL,
    holiday_name varchar(255) NOT NULL
);

COMMIT;
SELECT * FROM port_holiday;

-- 10. 검색 이력 저장
DROP TABLE IF EXISTS result_save;
CREATE TABLE IF NOT EXISTS result_save
(
   save_seq int AUTO_INCREMENT PRIMARY KEY,
   eta datetime NOT NULL,
   lat decimal(15, 10) NOT NULL,
   lon decimal(15, 10) NOT NULL,
   search_vsl varchar(300) NOT NULL,
   top1_port varchar(10) NOT NULL,
   top1_pred decimal(5, 2) NOT NULL,
   user_id varchar(50) NOT NULL,
      FOREIGN KEY (user_id) REFERENCES predict_user(user_id)
);

SELECT * FROM result_save;
DELETE FROM result_save;
COMMIT;


-- 10. 관리자 페이지 로그 테이블
-- Drop table if Exists admin_notice;
create table if not exists admin_notice(
	id 		Bigint auto_increment primary key,
	event_type varchar(30) not null,
	ask_seq Bigint not null,
	title varchar(255) not null,
	writer varchar(100) not null,
	created_at datetime not null default current_timestamp,
	is_read Tinyint(1) not null default 0
);

select * from admin_notice;

-- 10. 전체 ais 데이터 (항로)
DROP TABLE IF EXISTS ais_all;
CREATE TABLE IF NOT EXISTS ais_all
(
	ais_seq int AUTO_INCREMENT PRIMARY KEY,
	port_id varchar(10) NOT NULL,
	vsl_id varchar(300) NOT NULL,
	time_stamp datetime NOT NULL,
	lat decimal(15, 10) NOT NULL,
	lon decimal(15, 10) NOT NULL,
	cog decimal(15, 10) NOT NULL,
	heading decimal(15, 10) NOT NULL,
		FOREIGN KEY (port_id) REFERENCES port_info(port_id),
		FOREIGN KEY (vsl_id) REFERENCES vessel_master(vsl_id)
);

SELECT * FROM ais_all;
-- DELETE FROM ais_all;
COMMIT;


-- 11. 타임포인트별 ais 데이터
DROP TABLE IF EXISTS ais_timepoint;
CREATE TABLE IF NOT EXISTS ais_timepoint
(
	ais_seq int AUTO_INCREMENT PRIMARY KEY,
	port_id varchar(10) NOT NULL,
	vsl_id varchar(300) NOT NULL,
	time_stamp datetime NOT NULL,
	time_point int NOT NULL,
	lat decimal(15, 10) NOT NULL,
	lon decimal(15, 10) NOT NULL,
	cog decimal(15, 10) NOT NULL,
	heading decimal(15, 10) NOT NULL,
		FOREIGN KEY (port_id) REFERENCES port_info(port_id),
		FOREIGN KEY (vsl_id) REFERENCES vessel_master(vsl_id)
);

SELECT * FROM ais_timepoint;
COMMIT;

-- 12. 검색 이력 저장
DROP TABLE IF EXISTS result_save;
CREATE TABLE IF NOT EXISTS result_save
(
	save_seq int AUTO_INCREMENT PRIMARY KEY,
	search_vsl varchar(300) NOT NULL,
	user_id varchar(50) NOT NULL,
	lat decimal(15, 10) NOT NULL,
	lon decimal(15, 10) NOT NULL,
	top1_port varchar(10) NOT NULL,
	top1_pred decimal(5, 2) NOT NULL,
	eta datetime NOT NULL,
		FOREIGN KEY (search_vsl) REFERENCES vessel_master(vsl_id),
		FOREIGN KEY (user_id) REFERENCES predict_user(user_id)
);

SELECT * FROM result_save;
DELETE FROM result_save;
COMMIT;

-- 13. 실시간 상담원 채팅
CREATE TABLE chat_room (
  id           BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id      BIGINT NULL,             -- 회원이면 FK, 비회원이면 NULL
  guest_id     VARCHAR(64) NULL,        -- 비회원 UUID
  status       ENUM('OPEN','ASSIGNED','CLOSED') NOT NULL DEFAULT 'OPEN',
  assignee_id  BIGINT NULL,             -- 담당 관리자(선택)
  last_msg_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_room_user(user_id),
  INDEX idx_room_guest(guest_id),
  INDEX idx_room_status(status),
  INDEX idx_room_last(last_msg_at)
);
select * from chat_room;
commit;
-- H2/MySQL 공통
UPDATE chat_room SET last_msg_at = NOW() WHERE last_msg_at IS NULL;


CREATE TABLE chat_message (
  id           BIGINT PRIMARY KEY AUTO_INCREMENT,
  room_id      BIGINT NOT NULL,
  sender_type  ENUM('USER','ADMIN','SYSTEM') NOT NULL,
  sender_id    BIGINT NULL,             -- USER/ADMIN id (게스트면 NULL)
  content      TEXT NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_by_admin    TINYINT(1) NOT NULL DEFAULT 0,
  read_by_user     TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_msg_room FOREIGN KEY (room_id) REFERENCES chat_room(id) ON DELETE CASCADE,
  INDEX idx_msg_room_created(room_id, created_at),
  INDEX idx_msg_unread_admin(room_id, read_by_admin),
  INDEX idx_msg_unread_user(room_id, read_by_user)
);

select * from chat_message;
commit;
UPDATE chat_message
SET sender_type='ADMIN'
WHERE sender='ADMIN' AND sender_type <> 'ADMIN';
-- sender_id 컬럼을 문자형 sender로 변경
ALTER TABLE chat_message 
  CHANGE COLUMN sender_id sender VARCHAR(64) NULL;
