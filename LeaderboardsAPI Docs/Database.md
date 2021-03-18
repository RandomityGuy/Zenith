## Database Structure

Below are the necessary tables required for a functioning leaderboards.

### Achievement Categories: achievement_categories

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | INT | PRIMARY KEY, NOT NULL, AUTOINCREMENT | NULL | The id |
| title | TEXT | None | NULL | The title of the category |
| bitmap_path | TEXT | None | NULL | The path where the achievement bitmaps are stored |


### Achievement Names: achievement_names

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | INT | PRIMARY KEY, NOT NULL, AUTOINCREMENT | NULL | The id |
| category_id | INT | AUTOINCREMENT | 1 | The category id for the achievement |
| index | INT | None | NULL | The order of the achievement |
| title | TEXT | None | NULL | The title of the achievement |
| description | TEXT | None | NULL | The description of the achievement |
| rating | INT | None | 0 | The rating given by the achievement |
| reward_flair | INT | None | NULL | The flair given by completing the achievement |
| mask | TINYINT(1) | None | 0 | None |
| manual | TINYINT(1) | None | 0 | None |
| bitmap_extent | VARCHAR(8) | None | 113 44 | The bitmap extent used by the game for rendering |

### Marbles: marbles

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | Enter description here |
| category_id | int | | None | Enter description here |
| name | text | | None | Enter description here |
| shape_file | text | | None | Enter description here |
| skin | text | | None | Enter description here |
| shaderV | text | | None | Enter description here |
| shaderF | text | | None | Enter description here |
| sort | int | | None | Enter description here |
| disabled | tinyint(1) | | 0 | Enter description here |

### Match Scores: match_scores

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | Enter description here |
| match_id | int | | None | Enter description here |
| user_id | int | | None | Enter description here |
| score_id | int | | None | Enter description here |
| team_id | int | | None | Enter description here |
| placement | int | | 1 | Enter description here |
| time_percent | float | | 1 | Enter description here |

### Match Teams: match_teams

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | Enter description here |
| match_id | int | | None | Enter description here |
| name | text | | None | Enter description here |
| color | int | | None | Enter description here |
| player_count | int | | 0 | Enter description here |

### Matches: matches

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | Enter description here |
| mission_id | int | | None | Enter description here |
| player_count | int | | None | Enter description here |
| team_count | int | | 0 | Enter description here |
| rating_multiplier | float | | 1 | Enter description here |
| server_address | text | | None | Enter description here |
| server_port | int | | None | Enter description here |
| dedicated | tinyint(1) | | 0 | Enter description here |

### Mission Difficulties: mission_difficulties

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | Enter description here |
| game_id | int | | None | Enter description here |
| name | text | | None | Enter description here |
| display | text | | None | Enter description here |
| sort_index | int | | None | Enter description here |
| directory | text | | None | Enter description here |
| bitmap_directory | text | | None | Enter description here |
| previews_directory | text | | None | Enter description here |
| is_local | tinyint(1) | | 0 | Enter description here |
| disabled | tinyint(1) | | 0 | Enter description here |

### Mission Games: mission_games

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | Enter description here |
| name | text | | None | Enter description here |
| display | text | | None | Enter description here |
| sort_index | int | | None | Enter description here |
| long_display | text | | None | Enter description here |
| rating_column | text | | None | Enter description here |
| game_type | enum('Single Player','Multiplayer') | | Single Player | Enter description here |
| has_platinum_times | tinyint(1) | | 1 | Enter description here |
| has_ultimate_times | tinyint(1) | | 1 | Enter description here |
| has_awesome_times | tinyint(1) | | 0 | Enter description here |
| has_easter_eggs | tinyint(1) | | 1 | Enter description here |
| platinum_time_name | text | | None | Enter description here |
| ultimate_time_name | text | | None | Enter description here |
| awesome_time_name | text | | None | Enter description here |
| easter_egg_name | text | | None | Enter description here |
| platinum_time_count | int | | 0 | Enter description here |
| ultimate_time_count | int | | 0 | Enter description here |
| awesome_time_count | int | | 0 | Enter description here |
| egg_count | int | | 0 | Enter description here |
| force_gamemode | text | | None | Enter description here |
| has_blast | tinyint(1) | | 1 | Enter description here |
| disabled | tinyint(1) | | 0 | Enter description here |

### Mission Rating Info: mission_rating_info

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| mission_id | int | PRIMARY KEY  NOT NULL  | None | Enter description here |
| par_time | int | | 0 | Enter description here |
| platinum_time | int | | 0 | Enter description here |
| ultimate_time | int | | 0 | Enter description here |
| awesome_time | int | | 0 | Enter description here |
| par_score | int | | 0 | Enter description here |
| platinum_score | int | | 0 | Enter description here |
| ultimate_score | int | | 0 | Enter description here |
| awesome_score | int | | 0 | Enter description here |
| versus_par_score | int | | 0 | Enter description here |
| versus_platinum_score | int | | 0 | Enter description here |
| versus_ultimate_score | int | | 0 | Enter description here |
| versus_awesome_score | int | | 0 | Enter description here |
| completion_bonus | int | | 0 | Enter description here |
| set_base_score | int | | 0 | Enter description here |
| multiplier_set_base | float | | 0 | Enter description here |
| platinum_bonus | int | | 0 | Enter description here |
| ultimate_bonus | int | | 0 | Enter description here |
| awesome_bonus | int | | 0 | Enter description here |
| standardiser | int | | 0 | Enter description here |
| time_offset | int | | 100 | Enter description here |
| difficulty | float | | 1 | Enter description here |
| platinum_difficulty | float | | 1 | Enter description here |
| ultimate_difficulty | float | | 1 | Enter description here |
| awesome_difficulty | float | | 1 | Enter description here |
| hunt_multiplier | int | | 0 | Enter description here |
| hunt_divisor | int | | 0 | Enter description here |
| hunt_completion_bonus | int | | 1 | Enter description here |
| hunt_par_bonus | int | | 0 | Enter description here |
| hunt_platinum_bonus | int | | 0 | Enter description here |
| hunt_ultimate_bonus | int | | 0 | Enter description here |
| hunt_awesome_bonus | int | | 0 | Enter description here |
| hunt_max_score | int | | 0 | Enter description here |
| quota_100_bonus | int | | 0 | Enter description here |
| gem_count | int | | 0 | Enter description here |
| gem_count_1 | int | | 0 | Enter description here |
| gem_count_2 | int | | 0 | Enter description here |
| gem_count_5 | int | | 0 | Enter description here |
| gem_count_10 | int | | 0 | Enter description here |
| has_egg | tinyint(1) | | 0 | Enter description here |
| egg_rating | int | | 0 | Enter description here |
| disabled | tinyint(1) | | 0 | Enter description here |
| normally_hidden | tinyint(1) | NOT NULL  | 0 | Enter description here |
| notes | text | | None | Enter description here |

### Missions: missions

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | Enter description here |
| game_id | int | NOT NULL  | None | Enter description here |
| difficulty_id | int | NOT NULL  | None | Enter description here |
| file | text | | None | Enter description here |
| basename | text | NOT NULL  | None | Enter description here |
| name | text | NOT NULL  | None | Enter description here |
| gamemode | text | NOT NULL  | None | Enter description here |
| sort_index | int | | 1 | Enter description here |
| is_custom | tinyint(1) | | 0 | Enter description here |
| hash | varchar(64) | | None | Enter description here |
| modification | text | | None | Enter description here |

### Settings: settings

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | Enter description here |
| key | text | | None | Enter description here |
| value | text | | None | Enter description here |

### User Achievements: user_achievements

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | Enter description here |
| user_id | int | | None | Enter description here |
| achievement_id | int | | None | Enter description here |
| timestamp | timestamp | NOT NULL  DEFAULT_GENERATED| CURRENT_TIMESTAMP | Enter description here |

### User Current Marble Selection: user_current_marble_selection

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | Enter description here |
| user_id | int | NOT NULL  | 0 | Enter description here |
| marble_id | int | NOT NULL  | 0 | Enter description here |

### User Eggs: user_eggs

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | Enter description here |
| user_id | int | NOT NULL  | 0 | Enter description here |
| mission_id | int | NOT NULL  | 0 | Enter description here |
| time | int | | None | Enter description here |
| timestamp | timestamp | NOT NULL  DEFAULT_GENERATED| CURRENT_TIMESTAMP | Enter description here |

### User Event Snowballs: user_event_snowballs

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| score_id | int | PRIMARY KEY  NOT NULL  | None | Enter description here |
| snowballs | int | | 0 | Enter description here |
| hits | int | | 0 | Enter description here |

### User Event Triggers: user_event_triggers

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| user_id | int | PRIMARY KEY  NOT NULL  | None | Enter description here |
| trigger | int | PRIMARY KEY  NOT NULL  | None | Enter description here |
| timestamp | timestamp | DEFAULT_GENERATED| CURRENT_TIMESTAMP | Enter description here |

### User Lap Times: user_lap_times

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | Enter description here |
| mission_id | int | | None | Enter description here |
| user_id | int | | None | Enter description here |
| time | int | | 5999999 | Enter description here |
| timestamp | timestamp | NOT NULL  DEFAULT_GENERATED| CURRENT_TIMESTAMP | Enter description here |

### User Mission Ratings: user_mission_ratings

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| mission_id | int | PRIMARY KEY  NOT NULL  | None | Enter description here |
| user_id | int | PRIMARY KEY  NOT NULL  | None | Enter description here |
| rating | int | | 0 | Enter description here |

### User Ratings: user_ratings

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| user_id | int | PRIMARY KEY  NOT NULL  | None | Enter description here |
| rating_general | int | | 0 | Enter description here |
| rating_mbg | int | | 0 | Enter description here |
| rating_mbp | int | | 0 | Enter description here |
| rating_mbu | int | | 0 | Enter description here |
| rating_pq | int | | 0 | Enter description here |
| rating_custom | int | | 0 | Enter description here |
| rating_egg | int | | 0 | Enter description here |
| rating_quota_bonus | int | | 0 | Enter description here |
| rating_achievement | int | | 0 | Enter description here |
| rating_mp | int | | 0 | Enter description here |

### User Scores: user_scores

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| id | int | PRIMARY KEY  NOT NULL  auto_increment| None | Enter description here |
| user_id | int | NOT NULL  | 0 | Enter description here |
| mission_id | int | NOT NULL  | 0 | Enter description here |
| score | int | | None | Enter description here |
| score_type | enum('time','score') | NOT NULL  | time | Enter description here |
| total_bonus | int | | None | Enter description here |
| rating | int | | 0 | Enter description here |
| gem_count | int | | None | Enter description here |
| gems_1_point | int | | 0 | Enter description here |
| gems_2_point | int | | 0 | Enter description here |
| gems_5_point | int | | 0 | Enter description here |
| gems_10_point | int | | 0 | Enter description here |
| modifiers | int | | 0 | Enter description here |
| origin | enum('PhilsEmpire','MarbleBlast.com','MarbleBlastPlatinum','PlatinumQuest','Ratings Viewer','External') | | PlatinumQuest | Enter description here |
| extra_modes | text | | None | Enter description here |
| sort | int | | 0 | Enter description here |
| disabled | tinyint(1) | NOT NULL  | 0 | Enter description here |
| timestamp | timestamp | NOT NULL  DEFAULT_GENERATED| CURRENT_TIMESTAMP | Enter description here |

### User Streaks: user_streaks

| COLUMN NAME | DATA TYPE | FLAGS | DEFAULT | DESCRIPTION |
|-------------|-----------|-------|---------|-------------|
| user_id | int | PRIMARY KEY  NOT NULL  | None | Enter description here |
| mp_games | int | | 0 | Enter description here |