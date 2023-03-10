// adapted from https://www.tutorialspoint.com/levenshtein-distance-in-javascript
export function wordsAreSimilar(str1, str2, dist=6) {
   if (str1 == undefined || str1 == "" || str2 == undefined || str2 == "") {
        return 0; 
   }

   str1 = str1.replace(/^[A-Za-z]/g, '');
   str2 = str2.replace(/^[A-Za-z]/g, '');

   const track = Array(str2.length + 1).fill(null).map(() =>
       Array(str1.length + 1).fill(null)
   );

   for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
   }

   for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
   }

   for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
         const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
         track[j][i] = Math.min(
            track[j][i - 1] + 1, // deletion
            track[j - 1][i] + 1, // insertion
            track[j - 1][i - 1] + indicator, // substitution
         );
      }
   }

   return track[str2.length][str1.length] < dist;
};
