package net.dima.dima5_project.support;

import java.util.Map;

import org.springframework.stereotype.Component;

@Component
public class PortCoordinates {
    public record Coord(double lat, double lon) {
    }

    private static final Map<String, Coord> MAP = Map.ofEntries(
            Map.entry("다강", new Coord(23.11, 113.28)),
            Map.entry("황화", new Coord(31.23, 121.48)),
            Map.entry("롄윈강", new Coord(34.75, 119.38)),
            Map.entry("닝보", new Coord(29.87, 121.55)),
            Map.entry("난징", new Coord(32.06, 118.79)),
            Map.entry("칭다오", new Coord(36.07, 120.38)),
            Map.entry("르자오", new Coord(35.42, 119.52)),
            Map.entry("상하이", new Coord(31.23, 121.48)),
            Map.entry("톈진", new Coord(39.08, 117.20)),
            Map.entry("탕구싱강", new Coord(39.02, 117.72)),
            Map.entry("홍콩", new Coord(22.30, 114.17)),
            Map.entry("히로시마", new Coord(34.39, 132.46)),
            Map.entry("하카타", new Coord(33.59, 130.40)),
            Map.entry("이마바리", new Coord(34.07, 132.99)),
            Map.entry("이미즈", new Coord(36.91, 137.09)),
            Map.entry("가고시마", new Coord(31.60, 130.56)),
            Map.entry("마쓰야마", new Coord(33.83, 132.77)),
            Map.entry("모지", new Coord(33.95, 130.95)),
            Map.entry("나고야", new Coord(35.18, 136.90)),
            Map.entry("나가사키", new Coord(32.75, 129.87)),
            Map.entry("오사카", new Coord(34.69, 135.50)),
            Map.entry("시미즈", new Coord(35.02, 138.50)),
            Map.entry("도쿄", new Coord(35.68, 139.76)),
            Map.entry("고베", new Coord(34.69, 135.19)),
            Map.entry("와카야마", new Coord(34.23, 135.17)),
            Map.entry("욧카이치", new Coord(34.97, 136.62)),
            Map.entry("요코하마", new Coord(35.45, 139.63)),
            Map.entry("인천", new Coord(37.45, 126.60)),
            Map.entry("군산", new Coord(35.97, 126.71)),
            Map.entry("포항", new Coord(36.03, 129.37)),
            Map.entry("평택", new Coord(36.99, 127.08)),
            Map.entry("여수", new Coord(34.76, 127.66)),
            Map.entry("마닐라", new Coord(14.60, 120.98)),
            Map.entry("나홋카", new Coord(42.81, 132.88)),
            Map.entry("보스토치니", new Coord(42.74, 133.05)),
            Map.entry("기륭", new Coord(25.13, 121.74)),
            Map.entry("가오슝", new Coord(22.62, 120.30)),
            Map.entry("하이퐁", new Coord(20.86, 106.68)));

    public Coord getByKoName(String portNameKr) {
        return MAP.get(portNameKr);
    }
}