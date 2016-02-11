# focus bot

A simple bot which integrates with http://unleash.x-team.com and pulls your latest goals to keep you focused on what's really important.

## Usage

Slackbot responds to 2 questions:

- `hi` / `hello` (show instructions)
- `show <email@x-team.com>` (list all cards by a given registered Unleash user)

Furthermore, it can respond to user's action after the list of cards has been shown. It also provides basic data validation.

## Installation

1. First make a bot integration inside of your Slack channel. Go here: https://my.slack.com/services/new/bot
2. Enter a name for your bot. Make it something fun and friendly!
3. When you click "Add Bot Integration", you are taken to a page where you can add additional details about your bot, like an avatar, as well as customize its name & description.
4. Copy the API token that Slack gives you. You'll need it. Also copy `firebase` secret and URL for your database.
5. Create `src/config.json` file, using tokens you just copied and with proper URLs
6. Your bot should be online! Within Slack, send it a quick direct message or mention the bot to say hello. It should say hello back!

## Todo

- [ ] Fix URLs
- [ ] Parse email address from Slack if possible
- [ ] Refactor the code
- [ ] Write tests
