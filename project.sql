USE busam;

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
ALTER TABLE predict_user
    MODIFY user_pwd varchar(100) NOT NULL;  -- 최소 60 필요(보통 100 권장)
ALTER TABLE predict_user 
	ADD COLUMN join_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- (ROLE_ADMIN) 관리자는 INSERT 구문으로 수동 입력해야 할 듯!

SELECT * FROM predict_user;

-- 2. 뉴스
-- DROP TABLE IF EXISTS news_board;
CREATE TABLE IF NOT EXISTS news_board
(
	news_seq int PRIMARY KEY AUTO_INCREMENT,
	publisher varchar(100) NOT NULL CHECK (publisher IN ('물류신문','쉬핑뉴스넷', '코리아쉬핑가제트')),
	news_title varchar(500) NOT NULL,
	register_date date NOT NULL,
	img_url varchar(1000) NOT NULL,
	news_url varchar(1000) NOT NULL	
);

SELECT * FROM news_board;
-- DELETE FROM news_board;
COMMIT;

-- 3. 문의
-- DROP TABLE IF EXISTS ask_board;
CREATE TABLE IF NOT EXISTS ask_board
(
	ask_seq       bigint 		AUTO_INCREMENT PRIMARY KEY,
	ask_type      varchar(100)  NOT NULL CHECK (ask_type IN ('회원가입','서비스 이용', '기타')),
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


-- 8. 국가별 공휴일 (부가정보)
-- DROP TABLE IF EXISTS port_holiday;
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
	vsl_width int NOT NULL
	
);

SELECT * FROM vessel_master;
-- DELETE FROM vessel_master;
COMMIT;


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
-- DELETE FROM result_save;
COMMIT;
