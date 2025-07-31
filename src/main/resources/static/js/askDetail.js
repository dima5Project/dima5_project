// 수정해도 됩니당 임의임!!
// 근데이게 항시 있어야해요!!!!!!!! 이거 없으면 문의 토글 안열림!!!!!

<script>
    $(function() {
        $(".ask-title").click(function (e) {
            e.preventDefault();
            const askSeq = $(this).data("id");
            const detailRow = $("#detail-" + askSeq);
            const contentBox = detailRow.find(".ask-detail-container");

            if (detailRow.is(":visible")) {
                detailRow.hide();
                return;
            }

            $(".ask-detail").hide(); // 다른 열린 거 닫기

            $.ajax({
                url: "/ask/askDetail",
                method: "GET",
                data: { askSeq: askSeq },
                success: function (fragment) {
                    contentBox.html(fragment);
                    detailRow.show();
                },
                error: function () {
                    contentBox.html("<p style='color:red;'>불러오기 실패</p>");
                    detailRow.show();
                }
            })
        })
    })
</script>
