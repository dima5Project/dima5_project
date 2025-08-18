package net.dima.dima5_project;
import net.dima.dima5_project.repository.VesselMasterRepository;
import net.dima.dima5_project.service.VesselService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test") // 테스트 DB 설정 쓰는 경우 유지, 없으면 지워도 됨
class Dima5ProjectApplicationTests {

    // @Autowired
    // private VesselMasterRepository vesselMasterRepository;

	@Autowired
    private VesselService vesselService;

    // @Test
    // void probeWithTypeAndQuery() {
    //     // 입력값 정리(공백 제거)
    //     String mmsi = "352978125".trim();
	// 	System.out.println(mmsi);
    //     Optional<String> vslId = vesselMasterRepository.findVslIdByVslMmsi(mmsi);

    //     vslId.ifPresentOrElse(
    //         id -> System.out.println("vsl_id = " + id),
    //         () -> System.out.println("NOT_FOUND: mmsi=" + mmsi)
    //     );

    //     // 실제 테스트로 쓰려면 존재를 보장하고 싶을 때만 아래 assertion 유지
    //     assertTrue(vslId.isPresent(), "vsl_id not found for mmsi=" + mmsi);
    // }

    // (USE HERE !!!)
	@Test
	void predictByImoOrMmsi() throws Exception {
    
		// 여기서 값 imo 또는 mmsi 지정
    String imo  = "9515606";
    String mmsi = "373126000";

    Map<String, Object> result = vesselService.predictByImoOrMmsi(imo, mmsi);

    ObjectMapper om = new ObjectMapper();
    System.out.println("=== FASTAPI RESULT START ===");
    System.out.println(om.writerWithDefaultPrettyPrinter().writeValueAsString(result));
    System.out.println("=== FASTAPI RESULT END ===");

    // 필요하면 검증 추가
    // org.junit.jupiter.api.Assertions.assertNotEquals("NOT_FOUND", result.get("error"));
	
	}
}
