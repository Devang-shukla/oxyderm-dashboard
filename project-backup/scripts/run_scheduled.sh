#!/bin/bash
# Master scheduler — called by cron/launchd
AGENT_DIR="$(cd "$(dirname "$0")" && pwd)"
MINUTE=$(date +%M)
HOUR=$(date +%H)
DAY=$(date +%u)  # 1=Mon

# Lead responder: every 5 min
$AGENT_DIR/agent_lead_responder.py >> $AGENT_DIR/logs/lead_responder.log 2>&1

# Content plan: Sundays at 18:00
if [ "$DAY" = "7" ] && [ "$HOUR" = "18" ] && [ "$MINUTE" = "00" ]; then
  $AGENT_DIR/agent_content_engine.py >> $AGENT_DIR/logs/content.log 2>&1
fi

# Blog writing: Tue/Fri at 09:00
if { [ "$DAY" = "2" ] || [ "$DAY" = "5" ]; } && [ "$HOUR" = "09" ]; then
  $AGENT_DIR/agent_blog_writer.py >> $AGENT_DIR/logs/blogs.log 2>&1
fi

# Weekly report: Mondays at 08:00
if [ "$DAY" = "1" ] && [ "$HOUR" = "08" ]; then
  $AGENT_DIR/agent_report.py >> $AGENT_DIR/logs/reports.log 2>&1
fi
