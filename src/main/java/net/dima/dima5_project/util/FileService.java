package net.dima.dima5_project.util;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;

public class FileService {
    public static String saveFile(MultipartFile uploadFile, String uploadPath) {

        // 저장 디렉토리 생성
        if (!uploadFile.isEmpty()) {
            File path = new File(uploadPath);
            if (!path.isDirectory()) // 경로가 존재하지 않으면 생성
                path.mkdirs();
        }

        // 예) jquery-3.7.1.min.js
        // bts.jpg ---> bts_cisdkdsosieskdowkerw.jpg
        String originalFilename = uploadFile.getOriginalFilename();
        String savedFilename = null; // 저장할 때 사용할 파일명 (jquery-3.7.1.min)
        String filename = null; // bts
        String ext = null; // 확장자
        String uuid = UUID.randomUUID().toString(); // 난수

        // .의 위치 찾기
        int position = originalFilename.lastIndexOf(".");

        if (position == -1) { // 확장자가 없는 파일
            ext = "";
            filename = originalFilename;
        } else { // bts.jpg
            ext = "." + originalFilename.substring(position + 1);
            filename = originalFilename.substring(0, position);
        }

        savedFilename = filename + "_" + uuid + ext;

        // 디렉토리에 저장하기
        String fullPath = uploadPath + "/" + savedFilename;

        File serverFile = null;
        serverFile = new File(fullPath);

        try {
            uploadFile.transferTo(serverFile);
        } catch (IOException e) { // 저장장치에 저장이 안된것이므로, DB도 저장하면 안됨
            savedFilename = null;
            e.printStackTrace();
        }

        return savedFilename;
    }

    // 파일 삭제
    public static boolean deleteFile(String fullPath) {
        boolean result = false; // 삭제여부 반환

        File file = new File(fullPath);
        if (file.isFile()) {
            result = file.delete();
        }

        return result;
    }
}
