// THE LAST VERSION OF EARTH: what each mission's crowds say in passing (the closing pass, the player's "don't repeat
// the same ... again and again": a line said in passing in one mission is never said in another).
//
// A crowd that has no lines of its own (places/specs: crowd.barks) speaks its region's pool (npcs.js AMBIENT: rain,
// settlement, future, ...). Each pool was written for one mission (Rain City for Mission 1, the settlement for
// Mission 4, Loop City for Mission 9, the 2196 city for Mission 14), and the missions that came back to a region
// spoke it again: the settlement's "We cook at the first fire" in Missions 4, 5, 7, 22 and 23, Rain City's "The 41
// is late" in Missions 1, 22 and 23, the survivors' "The memorial has your face" in Missions 13, 14, 18 and 23.
// Here every other mission whose crowd would speak a region's pool has its own, by the pool it replaces
// (crowds.js castLevel); a CASE FILES replay speaks its mission's (deck.origin). Each person says every other line
// of the pool (neighbours share the walla), in the crowd voice crowds.js gave them, so a pool is recorded once per
// voice that says it (voicelines.js walks the built levels).
export const MISSION_BARKS = {
  // the river bend, in the thriving year: the water keepers and the fishers (Mission 5, chain B)
  m05: {
    settlement: [
      'The river came round the bend in the night. Nobody dug it.',
      'Nets up before the flood moon. Tala says so, and the moon agrees.',
      'The fish swim the wrong way past the new bank. They will learn.',
      'My father kept the old channel. Now there are two rivers to keep.',
      'Do not cross the footbridge with a full pot. It is older than it looks.',
      'A stranger turned the water. The keepers have not stopped arguing.',
    ],
  },
  // the Ridge at the first sky: the sky-watchers (Mission 7)
  m07: {
    settlement: [
      'Count the stars twice. The second count is the true one.',
      'The gangway turns at the bell. Do not be on it when it stops.',
      'Lanterns low. The sky is reading tonight, not us.',
      'The roofs come down at the first frost. We build them again in spring.',
      'There is a star in the north that was not there for my mother.',
      'Somebody climbed the ring last night and did not leave footprints.',
    ],
  },
  // the delta port: the Unwritten irregulars at the sea wall, in 2196 (Mission 13)
  m13: {
    future: [
      'They shell us at the ninth minute. We shell them back at the ninth minute. Ask me why.',
      'Keep your head below the containers. The war repeats. You might not.',
      'Unwritten don\'t salute. We nod. Nod back.',
      'Every shell we fire, we have already been hit by. Work that out.',
    ],
  },
  // the anchor settlement under the storms, walking out (Mission 18)
  m18: {
    future: [
      'Leave the pots. Take the seeds.',
      'Walk, don\'t run. Running is how you end up in another hour.',
      'The storm over the canyon is a Tuesday. The one over the sea is older.',
      'Count the children. Count them again at the canyon.',
      'If the anchor goes red, don\'t look back at it. Looking never helped.',
      'My grandmother walked this road when it was a road.',
    ],
  },
  // the First Second's wedges: the people of earlier places, replaying their part of one second (Mission 22)
  m22: {
    settlement: [
      'The fire is lit. The fire was always lit.',
      'Someone stands where the ring will be. Do not wake him.',
      'Bring water to the stone. It is thirsty this morning.',
      'The river is listening. Say it slowly.',
    ],
    rain: [
      'Eight fourteen. Eight fourteen. Is your watch stuck too?',
      'Same rain. Same puddle. Same shoes. I am going to be late forever.',
      'Somebody is on the speakers again. Same voice. Same words.',
      'I have caught this train a thousand times. I have never got off it.',
    ],
  },
  // the road to the ring, every year at once (the Finale): Rain City's commuters, the settlement, 2196's gardeners
  m23: {
    rain: [
      'The 41 is on time. I don\'t trust it.',
      'Has the sky always had a hole in it? Look. Over the hill.',
      'They say the road goes all the way to the hill now. Through everything.',
      'I keep smelling woodsmoke. In the middle of the avenue.',
    ],
    settlement: [
      'The river is loud tonight. It knows something we don\'t.',
      'Bring the children to the stone. They should see this.',
      'There are lights where the hill was dark. Strangers\' fires.',
      'The man with no dust is walking north. Let him through.',
    ],
    future: [
      'Water first. Then the beans. Then whatever this is.',
      'Sunrise in the Notch. My mother said that was a story.',
      'Plant it anyway. That is the whole rule.',
      'Somebody is walking up the hill with no shadow. Don\'t stare.',
    ],
  },
};

// the pool a crowd of this mission speaks in place of a region's (null: the region's own)
export const missionBarks = (deck, pool) => MISSION_BARKS[deck?.origin || deck?.mkey]?.[pool] || null;
