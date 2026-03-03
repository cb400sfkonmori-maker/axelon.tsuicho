document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculate-btn');
    const resultSection = document.getElementById('result-section');
    const incomeInput = document.getElementById('income');
    const investmentInput = document.getElementById('investment');

    // UI Elements for output
    const sharesCountEl = document.getElementById('shares-count');
    const recognizedProfitEl = document.getElementById('recognized-profit');
    const taxTotalEl = document.getElementById('tax-total');
    const adviceTextEl = document.getElementById('advice-text');

    const ADVICES = [
        "真面目に働く者が泥水をすすり、一部の幹部が美酒に酔う。それが今の組織の病巣です。この痛みを抱えたまま、あなたは会社に飼われ続けますか？",
        "その損失は、あなたが人生の貴重な時間を切り売りして会社に尽くした結果の『報酬』です。早く血抜きをしなければ、いずれ組織ごと腐敗に呑み込まれます。",
        "会社の看板で商売している間に、あなたの貯金から何十万・何百万円単位で現金が消えてなくなるんですよ？この事実を放置することは、あなたの家族への裏切りでもあります。",
        "目を覚ましてください。毒饅頭を食わされた挙句、自分で税金まで払わされているこの異常事態。この屈辱にメスを入れないなら、私はあなたを救えません。",
        "「不当な二重価格」は、従業員の忠誠心を逆手に取った搾取の構造です。あなたは今、自分が組織の生け贄であることに気づきましたね。"
    ];

    let impactChartInstance = null;
    function renderImpactChart(maxBenefit) {
        const ctx = document.getElementById('impact-chart').getContext('2d');
        const incomeLevels = [300, 500, 700, 1000, 1200, 1500, 1800];
        const dataValues = incomeLevels.map(inc => {
            const taxRate = getIncomeTaxRate(inc * 10000) + 0.10;
            return Math.floor(maxBenefit * taxRate) / 10000; // 万円単位
        });

        const bgColors = incomeLevels.map((inc, i) => {
            const red = 100 + (155 * i / (incomeLevels.length - 1));
            return `rgba(${red}, 0, 0, 0.8)`;
        });

        if (impactChartInstance) {
            impactChartInstance.destroy();
        }

        Chart.defaults.color = "#f0f0f0";
        impactChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: incomeLevels.map(i => `${i}万`),
                datasets: [{
                    label: '追加税額（万円）',
                    data: dataValues,
                    backgroundColor: bgColors,
                    borderColor: 'rgba(255, 42, 42, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.parsed.y}万円`
                        }
                    },
                    datalabels: {
                        color: 'white',
                        anchor: 'end',
                        align: 'top',
                        formatter: (value) => value + '万',
                        font: { weight: 'bold', size: 14 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    document.getElementById('close-popup-btn').addEventListener('click', () => {
        document.getElementById('popup-overlay').classList.add('hidden');
    });

    function getIncomeTaxRate(incomeYen) {
        // 日本の所得税率（簡易概算・累進課税）
        if (incomeYen <= 1950000) return 0.05;
        if (incomeYen <= 3300000) return 0.10;
        if (incomeYen <= 6950000) return 0.20;
        if (incomeYen <= 9000000) return 0.23;
        if (incomeYen <= 18000000) return 0.33;
        if (incomeYen <= 40000000) return 0.40;
        return 0.45;
    }

    calculateBtn.addEventListener('click', () => {
        const incomeManYen = parseFloat(incomeInput.value);
        let investmentManYen = parseFloat(investmentInput.value);

        if (isNaN(incomeManYen) || isNaN(investmentManYen)) {
            alert("現在の年収と持株購入総額を半角数字で正しく入力してください。");
            return;
        }

        // 従業員枠の上限は50万円
        if (investmentManYen > 50) {
            alert("従業員枠の購入総額は最大50万円です。50万円で計算します。");
            investmentManYen = 50;
            investmentInput.value = 50;
        }

        const incomeYen = incomeManYen * 10000;
        const investmentYen = investmentManYen * 10000;

        // 【外科的データ】
        // 会社が特定株主から買い取った価格: 5,751円/株
        // 従業員に売りつけた価格: 500円/株
        const originalPrice = 5751;
        const soldPrice = 500;
        const benefitPerShare = originalPrice - soldPrice; // 5,251円

        // 株数計算
        const sharesCount = Math.floor(investmentYen / soldPrice);

        // 認定利益（みなし給与として課税対象となる額）
        const recognizedProfit = sharesCount * benefitPerShare;

        // 税率（Input Aの年収ベースで概算）住民税は一律10%とする
        // ※正確には年収+認定利益でブラケットが上がる可能性があるが、今回は「Input Aから概算」の要件に従う
        const incomeTaxRate = getIncomeTaxRate(incomeYen);
        const residentTaxRate = 0.10;
        const totalTaxRate = incomeTaxRate + residentTaxRate;

        // 追徴課税額
        const additionalTax = Math.floor(recognizedProfit * totalTaxRate);

        // UI更新：株数、みなし給与
        sharesCountEl.textContent = sharesCount.toLocaleString();
        if (recognizedProfitEl) {
            recognizedProfitEl.textContent = Math.floor(recognizedProfit).toLocaleString();
        }

        // 数字のアニメーション表示
        resultSection.classList.remove('hidden');

        // チャートの描画（525万円の利益ベース）
        renderImpactChart(5251000);

        // 少しディレイを入れてからアニメーション開始（DOMレンダリングのため）
        requestAnimationFrame(() => {
            resultSection.classList.add('fade-in');

            // スムーズスクロール
            setTimeout(() => {
                resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);

            // リセット
            taxTotalEl.classList.remove('active');

            // 数字のカウントアップ演出
            animateValue(taxTotalEl, 0, additionalTax, 2500, () => {
                taxTotalEl.setAttribute('data-text', additionalTax.toLocaleString());
                taxTotalEl.classList.add('active');

                setTimeout(() => {
                    document.getElementById('popup-overlay').classList.remove('hidden');
                }, 1500);
            });

            // ランダムなアドバイスを選択して表示
            const randomAdvice = ADVICES[Math.floor(Math.random() * ADVICES.length)];
            adviceTextEl.textContent = randomAdvice;
        });
    });

    function animateValue(obj, start, end, duration, callback) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // イーズアウト（徐々に遅くなる）
            const easeOutQuart = 1 - Math.pow(1 - progress, 5);
            const currentVal = Math.floor(easeOutQuart * (end - start) + start);

            obj.innerHTML = currentVal.toLocaleString();

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end.toLocaleString(); // 最後に正確に合わせる

                // 終了時に数字を揺らすエフェクト
                obj.style.transform = "scale(1.1)";
                setTimeout(() => {
                    obj.style.transform = "scale(1)";
                    if (callback) callback();
                }, 200);
            }
        };
        window.requestAnimationFrame(step);
    }
});
