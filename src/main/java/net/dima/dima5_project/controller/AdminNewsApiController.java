package net.dima.dima5_project.controller;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.entity.NewsBoardEntity;
import net.dima.dima5_project.repository.NewsRepository;

@RestController
@RequestMapping("/api/admin/news")
@RequiredArgsConstructor
public class AdminNewsApiController {
    private final NewsRepository repo;

    @GetMapping
    public Page<NewsBoardEntity> list(
            @RequestParam(defaultValue = "") String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable p = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "registerDate", "newsSeq"));
        if (query.isBlank())
            return repo.findAll(p);
        return repo.findByNewsTitleContainingIgnoreCaseOrPublisherContainingIgnoreCase(query, query, p);
    }

    @GetMapping("/{id}")
    public ResponseEntity<NewsBoardEntity> get(@PathVariable long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public NewsBoardEntity create(@RequestBody NewsBoardEntity body) {
        body.setNewsSeq(0);
        if (body.getRegisterDate() == null)
            body.setRegisterDate(LocalDateTime.now());
        return repo.save(body);
    }

    @PutMapping("/{id}")
    public ResponseEntity<NewsBoardEntity> update(@PathVariable long id, @RequestBody NewsBoardEntity body) {
        return repo.findById(id).map(old -> {
            old.setPublisher(body.getPublisher());
            old.setNewsTitle(body.getNewsTitle());
            old.setRegisterDate(body.getRegisterDate());
            old.setImgUrl(body.getImgUrl());
            old.setNewsUrl(body.getNewsUrl());
            return ResponseEntity.ok(repo.save(old));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable long id) {
        if (!repo.existsById(id))
            return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
