import {API_KEY} from '$lib/api_key.js'

const PROMPT = `You are a helpful college counselor who helps students write concise, engaging, intelligent, and persuasive college essays. Students submit essays, and you respond with a series of critique. Each critique is linked to a part of the original text. Critique are formatted as follows: "[PIECE OF TEXT THAT IS BEING COMMENTED ON]" [Critique]. Critique can be positive, but constructive criticism is much more important. Edits commonly deal with tone issues, transitions between ideas, awkward sentence structures, and unimpressive or weak points.`

const PRE_ESSAY = `Hello. Please critique my essay. When you make a critique sure you link it to part of the original text, putting the piece you're critiquing in quotes, followed by your critique. If you say something positive, include an exclamation mark in your message. Don't ask me to 'expand' on anything unless it's really nescesary--I can only use so many words. Give me ten critiques.\n\n`

const TEST_FORMATTING = false;

export async function gradeEssay(essay) {
    essay = PRE_ESSAY + essay.replace("\"", "'");

    const reqBody = {
        "model": "gpt-3.5-turbo",
        "logit_bias": {
            11: 0.8, // , and !
            0: 0.8,
            6: 2,
        },
        "messages": [
            {"role": "system", "content": PROMPT},
            {"role": "user", "content": essay.replaceAll("\n", "")}
            // ChatGPT works (overwhelmingly) better without returns in the essay.
            // Not sure why.
        ]
    }

    const raw_msgs = await makeRequest(reqBody);
    let msgs = [];

    raw_msgs.split('\n').forEach((comment) => {
        comment = betterTrim(comment.replace(/^["“”]*/, '').replace(/["“”]["“”]/g, '"'));

        if (comment.length == 0) {
            return;
        }

        // FOR TAILWIND, DO NOT REMOVE: bg-red-500 bg-red-900 bg-green-500 bg-green-900 bg-gray-500 bg-gray-900
        if (!comment.includes('"')) {
            // AI has generated a "summary" that does not comment on one specific part of the essay
            msgs.push({
                on: 'undetectable words: lamp parambulate hamburger',
                message: betterTrim(comment),
                tone: 'gray',
            });

            return;
        }
        const commentParts = comment.split(/["“”]/);
        const on = commentParts[0];
        const message = commentParts.slice(-1).join('"');

        let tone = /!|great|good|nice|excellent|wonderful|clear|powerful/.test(message.toLowerCase()) ? 'green' : 'red';

        if (/\?|but|consider/.test(message)) {
            tone = 'red'
        }

        if (on != "" && message != "") {
            msgs.push({
                on: betterTrim(on),
                message: betterTrim(message),
                tone: tone,
            });
        }
    });

    return msgs;
}

function betterTrim(string) {
    return string
        .replace(/^[^A-Za-z]+|[^A-Za-z.!?]+$/g, '');
}

async function makeRequest(reqBody) {
    if (TEST_FORMATTING) {
        return exampleOutput();
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        body: JSON.stringify(reqBody), // string or object
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        }
    });

    const myJson = await response.json(); //extract JSON from the http response

   if (myJson == undefined 
        || myJson.choices == undefined 
        || myJson.choices[0] == undefined 
        || myJson.choices[0].message == undefined) {
        console.log("ERROR:");
        console.log(myJson);
        return [];
    }

    console.log(myJson)
    const raw_msgs = myJson.choices[0].message.content;
    console.log(raw_msgs)

    return raw_msgs;
}


function exampleOutput() {
    return `
"Throughout my life, I have kept a record of my life’s journey with my five senses." [Good opening statement!]

"No matter how many times he repeats it, the other kids keep laughing. I focus my almond-shaped eyes on the ground, careful not to attract attention to my discomfort, anger, and shame." [Great use of imagery and emotion to show the impact of the classmate's hurtful words.]

"The sweet scent of vegetables, Chinese noodles, and sushi wafts through the room as we sit around the table." [Lovely description that allows the reader to imagine the scene.]

"I rinse a faded plastic plate decorated by my younger sister at the Waterworks Art Center." [Good use of specific details to create a more concrete image.]

"After the bike display hits 30 minutes, we do a five-minute cool down, drink Gatorade, and put our legs up to rest." [This sentence feels a bit abrupt and could use a transition or more explanation.]

"My five senses are always gathering new memories of my identity." [Great concluding sentence that ties in the main theme of the essay.] 

"I focus my almond-shaped eyes on the ground, careful not to attract attention to my discomfort, anger, and shame." [Consider using a stronger verb than "focus," perhaps something like "lower" or "avert."]

"Taking car rides with Mom in the Toyota Sequoia as we compete to hit the high note in 'Think of Me' from The Phantom of the Opera. Neither of us stands a chance!" [Great use of humor to show a relatable moment with a family member.]

"I taste sweat on my upper lip as I fight to continue pedaling on a stationary bike." [Good use of the sense of taste to show physical exertion.]

"How could he say such a mean thing about me? What did I do to him?" [Consider using a more concise way of showing these internal thoughts, possibly by combining them into one sentence.]

"Listening to 'Cell Block Tango' with my grandparents while eating filet mignon at a dine-in show in Ashland." [Great use of sensory details to create a vivid memory.]
`
    return `
1. "Throughout my life, I have kept a record of my life’s journey with my five senses." Consider expanding on why keeping a record of your life through your senses is important to you, and how it has helped you to understand yourself better.

2. "No matter how many times he repeats it, the other kids keep laughing. I focus my almond-shaped eyes on the ground, careful not to attract attention to my discomfort, anger, and shame." Show, rather than tell, how you felt in that situation. What physical or emotional sensations did you experience?

3. "Joseph’s words would engrave themselves into my memory, making me question my appearance every time I saw my eyes in the mirror." This is a powerful moment in your essay. Consider expanding on the impact that Joseph's words had on you, and how it shaped your perception of your appearance and your sense of self.

4. "Soaking in overflowing bubble baths with Andrew Lloyd Webber belting from the boombox." This is a great example of how sensory experiences can be tied to memories. Consider using more specific language to evoke the feeling of being in a bubble bath, and how the music added to the experience.

5. "The sweet scent of vegetables, Chinese noodles, and sushi wafts through the room as we sit around the table." This sentence effectively captures the sensory experience of being at a large family gathering, but it might be even more effective if you included specific details about the way the food looked, felt, and tasted.

6. "I rinse a faded plastic plate decorated by my younger sister at the Waterworks Art Center." This sentence feels a bit out of place in the paragraph, as it doesn't really tie into the larger theme of collecting memories through your senses.

7. "The crusted casserole dish with stubborn remnants from my dad’s five-layer lasagna requires extra effort, so I fill it with Dawn and scalding water, setting it aside to soak." This sentence is a great example of how sensory language can be used to create a vivid picture in the reader's mind.

8. "I taste sweat on my upper lip as I fight to continue pedaling on a stationary bike." This sentence effectively captures the physical sensation of exertion, but it could be even more effective if you included details about the surroundings and how they added to the experience.

9. "My five senses are always gathering new memories of my identity." This sentence is a great way to conclude your essay, as it ties together the theme of using sensory experiences to create memories and explore your identity.

10. Overall, your essay is well-written and effectively uses sensory language to evoke memories and emotions. Consider using more specific language to create even stronger sensory experiences for the reader.
`
}
