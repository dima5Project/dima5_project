package net.dima.dima5_project.service;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.repository.AisTimepointRepository;
import net.dima.dima5_project.repository.PortInfoRepository;
import net.dima.dima5_project.repository.PortNameRepository;

@Service
@RequiredArgsConstructor
public class PredictService {
    private final AisTimepointRepository aisRepo;
    private final PortInfoRepository portInfoRepo;
    private final PortNameRepository portNameRepo;
    private final WebClient fastapi = WebClient.builder().baseUrl("http://localhost:8000").build();

    // public List<PredictedPortDTO> predictTop3(String vslId){
    //     var latest = aisRepo.findLatestByVslId(vslId)
    //         .orElseThrow(() -> new IllegalArgumentException("AIS 없음"));

    //     var res = fastapi.post().uri("/predict")
    //         .bodyValue(java.util.Map.of(
    //         "lat", latest.getLat(), "lon", latest.getLon(),
    //         "cog", latest.getCog(), "heading", latest.getHeading(),
    //         "timepoint", latest.getTimepoint()     // FastAPI가 시점매핑 수행
    //         ))
    //         .retrieve().bodyToMono(FastApiResponse.class).block();

    //     if(res==null || res.topk()==null || res.topk().isEmpty()) return java.util.List.of();

    //     var ids = res.topk().stream().map(TopKItem::portId).toList();
    //     var infoMap = portInfoRepo.findByPortIdIn(ids).stream()
    //         .collect(java.util.stream.Collectors.toMap(PortInfoEntity::getPortId, x->x));
    //     var nameMap = portNameRepo.findByPortIdIn(ids).stream()
    //         .collect(java.util.stream.Collectors.toMap(PortNameEntity::getPortId, x->x));

    //     var out = new java.util.ArrayList<PredictedPortDTO>();
    //     for (var k : res.topk()){
    //     var info = infoMap.get(k.portId());
    //     var name = nameMap.get(k.portId());
    //     out.add(new PredictedPortDTO(
    //         k.rank(), k.portId(), k.prob(),
    //         name!=null?name.getPortNameKr():null,
    //         name!=null?name.getCountryNameKr():null,
    //         info!=null?info.getLocLat().doubleValue():0d,
    //         info!=null?info.getLocLon().doubleValue():0d
    //     ));
    //     }
    //     return out;
    // }
}
