-- 2차 프로젝트 DB 구축
-- 25.07.28 MON

CREATE DATABASE IF NOT EXISTS `busam` DEFAULT CHARACTER SET UTF8MB3;
USE busam;

-- (필요하다면) 비밀번호 root로 변경
-- FLUSH PRIVILEGES;
-- ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';



-- 생성: 부모테이블부터 / 삭제: 자식테이블부터
-- fk : 자식테이블에 지정

-- 1. 사용자 정보
-- DROP TABLE IF EXISTS predict_user;
CREATE TABLE IF NOT EXISTS predict_user
(
	user_seq 	bigint 		 PRIMARY KEY AUTO_INCREMENT,
	user_name 	varchar(100) NOT NULL,
	user_id 	varchar(50)  UNIQUE,
	user_pwd 	varchar(50)  NOT NULL,
	user_email 	varchar(100) NOT NULL,
	user_type 	varchar(100) CHECK (user_type IN ('화주','선사','항만사','일반 사용자')),
	user_role 	varchar(50)  DEFAULT 'ROLE_USER' CHECK (user_role IN ('ROLE_USER', 'ROLE_ADMIN')) 
);

SELECT * FROM predict_user;
COMMIT;

-- 1-1. 비밀번호 자리수 변경
ALTER TABLE predict_user
	MODIFY user_pwd varchar(100) NOT NULL;  -- 최소 60 필요(보통 100 권장)

-- 1-2. 새로운 컬럼 추가
ALTER TABLE predict_user 
	ADD COLUMN join_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 1-3. (관리자용 페이지 대입할) 주차별 확인용 코드
SELECT
	DATE_FORMAT(join_date, '%Y-%m')            AS ym,  -- 충돌 방지용 그룹키
	CONCAT(
		DATE_FORMAT(join_date, '%m월 '),
		CEIL( (DAY(join_date) + (DAYOFWEEK(DATE_FORMAT(join_date, '%Y-%m-01')) - 1)) / 7 ), '주') AS month_week,
				COUNT(*) AS cnt
FROM predict_user
-- WHERE join_date >= '2025-07-01'            -- 필요하면 기간 필터
GROUP BY ym, month_week
ORDER BY MIN(join_date);

-- 1-4. 관리자 데이터 삽입
INSERT INTO predict_user (user_name, user_id, user_pwd, user_email, user_type, user_role)
VALUES (
	'관리자',
	'admin',
	'$2b$12$egE6vgtDweVhHfPI1OJcOu61Jg4jnryc.W0NvxyTqt2nWr0HZ6OrS',
	'admin@example.com',
	'일반 사용자',
	'ROLE_ADMIN'
);

-- 1-5. 
ALTER TABLE predict_user ADD COLUMN join_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2. 뉴스
-- DROP TABLE IF EXISTS news_board;
CREATE TABLE IF NOT EXISTS news_board
(
	news_seq bigint PRIMARY KEY AUTO_INCREMENT,
	publisher varchar(100) NOT NULL CHECK (publisher IN ('물류신문','쉬핑뉴스넷', '코리아쉬핑가제트')),
	news_title varchar(1000) NOT NULL,
	register_date date NOT NULL,
	img_url varchar(5000) NOT NULL,
	news_url varchar(5000) NOT NULL	
);

SELECT * FROM news_board;
DELETE FROM news_board;
COMMIT;


-- 3. 문의
-- DROP TABLE IF EXISTS ask_board;
CREATE TABLE IF NOT EXISTS ask_board
(
	ask_seq       bigint 		AUTO_INCREMENT PRIMARY KEY,
	ask_type      varchar(100)  NOT NULL CHECK (ask_type IN ('로그인','서비스 이용', '기타')),
	ask_title     varchar(200)  NOT NULL,
	ask_content   varchar(5000) NOT NULL,
	ask_writer    varchar(50)   NOT NULL,
	create_date 	  datetime  DEFAULT CURRENT_TIMESTAMP,
	original_filename varchar(1000),
	saved_filename 	  varchar(1000),
	ask_pwd 	  varchar(10),
	reply_status boolean DEFAULT false,
		FOREIGN KEY (ask_writer) REFERENCES predict_user(user_id)
);

SELECT * FROM ask_board;
-- DELETE FROM ask_board;
COMMIT;

-- 4. 관리자답변
-- DROP TABLE IF EXISTS ask_reply;
CREATE TABLE IF NOT EXISTS ask_reply
(
	reply_num bigint PRIMARY KEY,
	ask_title varchar(200) NOT NULL,
	reply_content varchar(5000) NOT NULL,
	reply_date datetime DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (reply_num) REFERENCES ask_board(ask_seq)
);

SELECT * FROM ask_reply;
COMMIT;


-- 5. 항구정보
-- DROP TABLE IF EXISTS port_info;
CREATE TABLE IF NOT EXISTS port_info
(
	port_id varchar(10)    PRIMARY KEY,
	loc_lat decimal(15, 10) NOT NULL,
	loc_lon decimal(15, 10) NOT NULL
);

SELECT * FROM port_info;
-- DELETE FROM port_info;


-- 6. 항구명 (port_info 부터 생성)
-- DROP TABLE IF EXISTS port_name;
CREATE TABLE IF NOT EXISTS port_name
(
	port_id		    varchar(10)  PRIMARY KEY NOT NULL,
	country_name_kr varchar(100)  NOT NULL,
	port_name_kr    varchar(100)  NOT NULL,
	country_name_en varchar(100)  NOT NULL,
	port_name_en    varchar(100)  NOT NULL,
		FOREIGN KEY (port_id) REFERENCES port_info(port_id)
);

COMMIT;
SELECT * FROM port_name;
-- DELETE FROM port_name;


-- 7. 항만혼잡도 (부가정보)
-- DROP TABLE IF EXISTS port_docking;
CREATE TABLE IF NOT EXISTS port_docking (
    docking_id int AUTO_INCREMENT PRIMARY KEY,
    time_stamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    port_id VARCHAR(10) NOT NULL,
    expected_ships int,
    current_ships int,
    	FOREIGN KEY (port_id) REFERENCES port_info(port_id)
);

SELECT * FROM port_docking;
COMMIT;

-- 8. 국가별 공휴일 (부가정보)
DROP TABLE IF EXISTS port_holiday;
CREATE TABLE IF NOT EXISTS port_holiday(
	holiday_seq int AUTO_INCREMENT PRIMARY KEY,
    holiday_date DATE NOT NULL,
    country_name_kr varchar(50) NOT NULL,
    holiday_name varchar(255) NOT NULL
);

SELECT * FROM port_holiday;
-- DELETE FROM port_holiday;
COMMIT;

-- 9. 선박정보
-- DROP TABLE IF EXISTS vessel_master;
CREATE TABLE IF NOT EXISTS vessel_master
(
	vsl_seq int AUTO_INCREMENT PRIMARY KEY,
	vsl_id varchar(300) NOT NULL UNIQUE,
	vsl_name varchar(100) NOT NULL,
	vsl_mmsi varchar(100) NOT NULL,
	vsl_imo varchar(100) NOT NULL,
	ship_type varchar(100) NOT NULL,
	call_sign varchar(50) NOT NULL,
	vsl_length int NOT NULL,
	vsl_width int NOT NULL,
	vsl_img varchar(1000)
	
);

SELECT * FROM vessel_master;
-- DELETE FROM vessel_master;
COMMIT;

-- 9-1. mmsi, imo 확인용
SELECT vsl_mmsi, vsl_imo
FROM vessel_master
WHERE vsl_id = '5808b892-f82c-3357-90e3-85effb0df39a';

-- 9-2. vsl_name 확인용
SELECT vsl_name, call_sign
FROM vessel_master
WHERE vsl_imo = '9515606';


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
-- DELETE FROM result_save;
COMMIT;

DESC result_save;

-- 11. 관리자 페이지 로그 테이블 (문의등록 시, 관리자 계정에 알림이 옴)
-- Drop table if Exists admin_notice;
create table if not exists admin_notice(
	id       Bigint auto_increment primary key,
	event_type varchar(30) not null,
	ask_seq Bigint not null,
	title varchar(255) not null,
	writer varchar(100) not null,
	created_at datetime not null default current_timestamp,
	is_read Tinyint(1) not null default 0
);

select * from admin_notice;
COMMIT;


-- 12. 실시간 상담원 채팅 (관리자)
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


-- 13. 실시간 상담원 채팅 (게스트)
CREATE TABLE IF NOT EXISTS chat_message (
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
WHERE sender_type = 'ADMIN' AND sender_type <> 'ADMIN';

-- sender_id 컬럼을 문자형 sender로 변경
ALTER TABLE chat_message 
    CHANGE COLUMN sender_id sender VARCHAR(64) NULL;










