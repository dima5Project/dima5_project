package net.dima.dima5_project;

import net.dima.dima5_project.repository.VesselMasterRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE) // 실제 DB 사용
@ActiveProfiles("test") // application-test.yml 쓰는 경우 유지
class VesselRepositoryDbTest {

    @Autowired
    private VesselMasterRepository vesselMasterRepository;

    @Test
    void findVslIdByImo_print() {
        String imo = "9187485".trim(); // 테스트할 IMO 값으로 바꾸세요

        Optional<String> vslId = vesselMasterRepository.findVslIdByVslImo(imo);

        vslId.ifPresentOrElse(
            id -> System.out.println("vsl_id (by IMO) = " + id),
            () -> System.out.println("NOT_FOUND (by IMO): " + imo)
        );

        // 존재가 보장되는 값으로 테스트하려면 assertion 유지
        // 보장되지 않으면 아래 줄은 주석 처리
        System.out.println( "vsl_id not found for imo=" + imo);
    }

    @Test
    void findVslIdByMmsi_print() {
        String mmsi = "352978125".trim(); // 테스트할 MMSI 값으로 바꾸세요

        Optional<String> vslId = vesselMasterRepository.findVslIdByVslMmsi(mmsi);

        vslId.ifPresentOrElse(
            id -> System.out.println("vsl_id (by MMSI) = " + id),
            () -> System.out.println("NOT_FOUND (by MMSI): " + mmsi)
        );

        // 존재가 보장되는 값으로 테스트하려면 assertion 유지
        // 보장되지 않으면 아래 줄은 주석 처리
        System.out.println( "vsl_id not found for MMSI=" + mmsi);
    }
}
