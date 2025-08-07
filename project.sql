-- 1. 사용자 정보
-- DROP TABLE IF EXISTS predict_user;
CREATE TABLE IF NOT EXISTS predict_user
(
   user_seq    bigint        PRIMARY KEY AUTO_INCREMENT,
   user_name    varchar(100) NOT NULL,
   user_id    varchar(50)  UNIQUE,
   user_pwd    varchar(50)  NOT NULL,
   user_email    varchar(100) NOT NULL,
   user_type    varchar(100) CHECK (user_type IN ('화주','선사','항만사','일반 사용자')),
   user_role    varchar(50)  CHECK (user_role IN ('ROLE_USER', 'ROLE_ADMIN')) 
);

SELECT * FROM predict_user;

-- 2. 뉴스 (0)
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
   ask_seq       bigint       PRIMARY KEY,
   ask_type      varchar(100)  DEFAULT '전체' CHECK (ask_type IN ('전체', '회원가입','서비스 이용', '기타')),
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


-- 5. 항구정보 (0)
-- DROP TABLE IF EXISTS port_info;
CREATE TABLE IF NOT EXISTS port_info
(
   port_id varchar(10)    PRIMARY KEY,
   loc_lat decimal(15, 10) NOT NULL,
   loc_lon decimal(15, 10) NOT NULL
);

SELECT * FROM port_info;
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
-- DROP TABLE IF EXISTS port_docking;
CREATE TABLE IF NOT EXISTS port_docking (
    docking_id int AUTO_INCREMENT PRIMARY KEY,
    time_stamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    port_id VARCHAR(10) NOT NULL,
    expected_ships int,
    current_ships int,
       FOREIGN KEY (port_id) REFERENCES port_info(port_id)
);

-- 8. 국가별 공휴일
-- DROP TABLE IF EXISTS port_holiday;
CREATE TABLE IF NOT EXISTS port_holiday(
   holiday_seq int AUTO_INCREMENT PRIMARY KEY,
    holiday_date DATE NOT NULL,
    country_name_kr varchar(50) NOT NULL,
    holiday_name varchar(255) NOT NULL
);

INSERT INTO port_holiday (holiday_date, country_name_kr, holiday_name)
VALUES
   ('2025-08-01', '중국', 'Armys Day'),
   ('2025-08-09', '싱가포르', 'National Day'),
   ('2025-08-12', '태국', 'H.M. the Queens Birthday'),
   ('2025-08-15', '대한민국', '광복절'),
   ('2025-08-15', '인도', 'Independence Day'),
   ('2025-08-30', '카자흐스탄', 'Constitution Day'),
   ('2025-08-31', '말레이시아', 'National Day');

COMMIT;
SELECT * FROM port_holiday;