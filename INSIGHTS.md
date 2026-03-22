# Three Things I Learned About The Game (INSIGHTS)

## Insight 1: "Hot Drop" Loot Funneling
* **What caught my eye:** Massive initial player traffic density aggregates systematically around specific central compounds (most visible on Ambrose Valley).
* **Back it up:** Using the "Traffic Flow" heatmap overlay combined with early timeline scrubbing, the visual data shows 60%+ of human players colliding in central hubs within the first 60 seconds, resulting in immediate Kill/Death event clusters.
* **Actionable Items & Affected Metrics:** 
  * *Actionable Item:* Redistribute high-tier loot spawns slightly further outward toward map perimeters.
  * *Metrics Affected:* 'Average Match Lifespan' (Time-to-kill/Time-to-death) will increase, and 'Map Utilization %' will widen.
* **Why a Level Designer should care:** If the meta-goal of an extraction shooter is tension over time, funneling 60% of players into an immediate bloodbath reduces total map exploration. Level Designers can tweak geometry and loot to better pacing.

## Insight 2: The Storm Collision Geometry
* **What caught my eye:** A distinct ribbon of "Killed By Storm" markers traces just behind highly navigated player pathways toward the match conclusion.
* **Back it up:** The visualization distinctly highlights purple Storm Death squares bottlenecking primarily around geographical transitions (bridges, valleys) rather than open fields.
* **Actionable Items & Affected Metrics:**
  * *Actionable Item:* Provide more lateral crossing points (e.g. secondary bridges, ziplines, or shallower ravines) near these identified terrain blockades, or slightly adjust the storm's velocity curve when passing over slow-traversal geometry.
  * *Metrics Affected:* 'Deaths by Environment' (Storm) will decrease, 'Successful Extraction Rate' will favorably increase.
* **Why a Level Designer should care:** Players should feel outplayed by opponents or their own timing, not helplessly trapped by map geometry that takes too long to traverse while the storm is moving at an un-outrunnable speed.

## Insight 3: Bot Engagement Value is Early-Weighted
* **What caught my eye:** AI Bots operate largely as early-game primer targets and rarely traverse effectively into the late-game alongside surviving humans.
* **Back it up:** The timeline timeline reveals Bot Kill events universally saturating the first 50-60% of a match. The pathing data shows rigid, localized patrol zones for bots, rather than them pushing toward extraction or central safety.
* **Actionable Items & Affected Metrics:**
  * *Actionable Item:* Assign dynamic patrol waypoints to bots that shift toward high-traffic human extraction zones as the match timer progresses. 
  * *Metrics Affected:* 'Late-Game Bot Engagements' will increase, and 'PVE-induced PVP Encounters' (players hearing bot gunfire late game) will rise.
* **Why a Level Designer should care:** Bots shouldn't just exist to pad early kill stats. They are tools to generate noise and tension. By making their traversal longer and more centralized over time, Level Designers can use bots to actively shape late-game human encounters.
