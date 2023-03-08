<script>
    import BigText from '$lib/BigText.svelte';
    import {gradeEssay} from '$lib/grader.js';
    import {wordsAreSimilar} from '$lib/levenshtein.js';
    import {EXAMPLES} from '$lib/examples.js';
    import {onMount} from 'svelte';

    let essayInput = "hello";
    let commentSec;
    let comments = [];
    let elevated = null;
    let grading = false;

    const RET = `<span class="hidden">$RET$</span>`;
    const SPACE = `<span class="hidden">$SPACE$</span> `;
    const NEWPARA = `<span class="hidden">$NEWPARA</span>`;

    function elevate(index) {
        elevated = index;

        const commentY = document.querySelector(`#a${index}.comment`);
        commentSec.scrollTo({
            left: 0, 
            top: commentY.offsetTop - 100,
            behavior: "smooth"
        });

        document.querySelectorAll(`.highlight`).forEach((highlight) => {
            highlight.classList.remove('elevated');
        });

        document.querySelectorAll(`#a${index}.highlight`).forEach((highlight) => {
            highlight.classList.add('elevated');
        });
    }

    onMount(() => {
        addEventListener('paste', (e) => {
            e.preventDefault();

            if (grading) { return }

            let text = e.clipboardData.getData("text/plain").trim().replace(/^[^A-z]*|^[A-z.!?]/g, "").replace(/[\n\r]+/g, "</br></br>");
            if (essayInput != null) {
                essayInput.set(text);
            }

            if (grading) { return }
            grading = true;

            doGrade();
        });
        addEventListener('keydown', (e) => {
            if (grading) { return }

            if (e.key == "R") {
                const essayIndex = Math.floor(Math.random() * EXAMPLES.length);
                const essay = EXAMPLES[essayIndex];
                if (essayInput != null) {
                    essayInput.set(essay);
                }

                grading = true;

                doGrade();
            }
        });
    })
    
    async function doGrade() {
        if (essayInput == null) {
            return
        }

        let essay = essayInput.get();
        comments = await gradeEssay(essay);

        const essaySplit = essay.replaceAll(" ", SPACE).replaceAll(/[\n\r]+/g, SPACE + NEWPARA + SPACE);
        essayInput.set(essaySplit);

        let commentTrack = comments.map((comment, index) => {
            return {
                words: comment.on.split(" ").map((word) => word.trim()),
                tone: comment.tone,
                index: index,
                found_count: 0,
                start: 0,
                missed: 0,
                approved: false,
            }
        });

        essayInput.set('');
        let buildingEssay = '';
        let height = essayInput.height();

        essaySplit.split(SPACE).filter((word) => word != "").forEach((word) => {
            if (word == NEWPARA) {
                buildingEssay += "</br></br>";
            }

            for (const [t, track] of commentTrack.entries()) {
                if (wordsAreSimilar(track.words[track.found_count], word, 1)) {
                    if (track.found_count == 0) {
                        track.start = buildingEssay.length;
                    }

                    track.found_count++;

                    if (track.found_count == track.words.length) {
                        track.approved = true;
                    }
                } else if (
                    track.found_count > 0 
                    && track.missed < 3
                    && wordsAreSimilar(word, track.words[track.found_count])
                ) {
                    track.missed++;
                    track.found_count++;
                } else if (
                    track.found_count > 0 
                    && track.missed < 3
                    && wordsAreSimilar(word, track.words[track.found_count + 1])
                ) {
                    track.missed++;
                    track.found_count += 2;
                } else {
                    if (track.found_count >= track.words.length - 2) {
                        track.approved = true;
                    }

                    track.found_count = 0;
                    track.missed = 0;
                }

                if (track.approved) {
                    const openSpan = `<span class="highlight ${track.tone}" id="a${track.index}">`;
                    const closSpan = '</span>';

                    let spanText = buildingEssay.slice(track.start)
                    spanText = spanText.replaceAll(RET, `${closSpan}<span style="opacity: 0">.</span>${openSpan}`);
                    spanText += `<sup>${track.index}</sup>`;

                    buildingEssay = 
                        buildingEssay.slice(0, track.start) 
                        + openSpan + spanText + closSpan + " ";
                    commentTrack.splice(t, 1);
                }
            }

            buildingEssay += `${word.trim()}${SPACE}`;
            essayInput.set(buildingEssay);

            if (essayInput.height() > height) {
                const last2Words = buildingEssay.split(SPACE).slice(-2).join(SPACE);
                buildingEssay = buildingEssay.slice(0, buildingEssay.length - last2Words.length);
                buildingEssay += RET;
                buildingEssay += `${last2Words}`;
                height = essayInput.height();
            }
        })

        essayInput.set(buildingEssay.replaceAll(SPACE, " "));

        console.log(commentTrack);

        document.querySelectorAll('.highlight').forEach((el) => {
            el.addEventListener('mouseover', (e) => {
                const id = +e.target.id.slice(1);
                elevate(id);
            });
        });

        grading = false;
    }
</script>

<div class="flex flex-col h-screen">
    <div class="px-24 flex flex-grow justify-center items-center flex-row min-h-0">
        <div class="basis-2/3 flex justify-center items-center flex-col h-full">
            <div class="block top-0 p-5 w-full h-full">
                <BigText bind:this={essayInput}/>
            </div>
        </div>
        <div class="basis-1/3 h-full overflow-scroll top-0 py-3 px-0" bind:this={commentSec}>
            {#each comments as comment, c}
                <div 
                    class="mb-5 bg-slate-900 text-white rounded-lg comment overflow-hidden"
                    id={"a" + c}
                    style="transform: scale({c == elevated ? "1.0" : "0.9"})"
                >
                    <div class="p-5">
                        <div class="text-md">{comment.message}</div>
                    </div>
                    <div class="bg-{comment.tone}-500 w-full h-5 text-sm px-2 align-middle">{c}</div>
                </div>
            {/each}
        </div>
    </div>
    <div class="h-8 bg-slate-900 px-5 text-white text-lg align-middle flex flex-row justify-between">
        <div>
            EssayGPT. Made with ❤️ by <a href="https://github.com/amjoshuamichael">joshuamichael</a>. <a href="https://github.com/amjoshuamichael/essayGPT">Github</a>
        </div>
        <div style="opacity: {grading ? 1.0 : 0.0}">
            Loading. Please wait..
        </div>
    </div>
</div>
