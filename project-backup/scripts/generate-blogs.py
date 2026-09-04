#!/usr/bin/env python3
"""
Autonomous Blog Post Generator for Oxyderm
Reads blog-briefs.json and generates full SEO-optimized blog posts
Uses Claude Pro via hermes CLI for generation
"""

import json
import subprocess
import os
from pathlib import Path

# Paths
BRIEFS_FILE = "/Users/genesis/Desktop/Oxyderm-Build/content/research/blog-briefs.json"
OUTPUT_DIR = "/Users/genesis/Desktop/Oxyderm-Build/content/blogs"
CLIENT_PROFILE = "/Users/genesis/Desktop/Oxyderm-Build/data/client-profile.json"

def load_briefs():
    with open(BRIEFS_FILE, 'r') as f:
        return json.load(f)

def load_client_profile():
    with open(CLIENT_PROFILE, 'r') as f:
        return json.load(f)

def generate_blog_post(brief, client_profile):
    """
    Generate a full blog post from a brief using Claude Pro
    """
    
    # Build the generation prompt
    prompt = f'''You are a medical aesthetics content writer for Oxyderm Laser Clinic in Edmonton.

CLIENT CONTEXT:
{json.dumps(client_profile, indent=2)}

BLOG BRIEF:
Title: {brief['title']}
Target Keyword: {brief['target_keyword']}
Secondary Keywords: {', '.join(brief['secondary_keywords'])}
Word Count Target: {brief['word_count']} words
Meta Title: {brief['meta_title']}
Meta Description: {brief['meta_desc']}

OUTLINE:
{chr(10).join(brief['outline'])}

CTA: {brief['cta']}
Internal Links: {', '.join(brief['internal_links'])}

WRITING INSTRUCTIONS:
1. Write in a professional but approachable tone (medical authority + warmth)
2. Use "we" (Oxyderm team), "you" (reader), avoid "I"
3. Include Edmonton-specific context (weather, local references, competition awareness)
4. SEO: Primary keyword in H1, first 100 words, 2-3x in body. Secondary keywords naturally throughout.
5. Add real-world examples, case studies (anonymized), and specific numbers
6. Include FAQ section at end (3-5 questions)
7. End with strong CTA + contact info (780-863-7561, oxydermlaserclinic.ca, address)
8. Medical disclaimer footer
9. Use markdown formatting: ## for H2, ### for H3, **bold** for emphasis
10. NO fluff, NO cliches ("embark on a journey"), NO sycophancy

EXAMPLE OPENING PARAGRAPH (tone reference):
"If you're researching [topic] in Edmonton, you've probably [common pain point]. The answer isn't as simple as [oversimplification]—your [solution] depends on [factors]. At Oxyderm Laser Clinic in Edmonton, we've helped thousands of clients [outcome]. Based on our experience, [key insight]."

Now write the COMPLETE blog post following the outline above. Output ONLY the markdown-formatted blog post, no preamble.'''

    # Call Claude via hermes (using current session's claude-pro setup)
    try:
        result = subprocess.run(
            ['hermes', 'chat', '--cli', '-z', prompt],
            capture_output=True,
            text=True,
            timeout=180  # 3 min max per post
        )
        
        if result.returncode == 0:
            return result.stdout.strip()
        else:
            print(f"❌ Error generating post: {result.stderr}")
            return None
            
    except subprocess.TimeoutExpired:
        print(f"⏱️ Timeout generating post for: {brief['title']}")
        return None
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None

def save_blog_post(brief, content):
    """Save generated blog post to appropriate week folder"""
    week_dir = Path(OUTPUT_DIR) / f"week-{brief['week']}"
    week_dir.mkdir(parents=True, exist_ok=True)
    
    # Create SEO-friendly filename from title
    filename = brief['title'].lower()
    filename = filename.replace(':', '').replace('?', '').replace('(', '').replace(')', '')
    filename = filename.replace(' ', '-')
    filename = filename[:80]  # Limit length
    filename += '.md'
    
    filepath = week_dir / filename
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    return str(filepath)

def main():
    print("🚀 Starting Autonomous Blog Post Generator")
    print("=" * 60)
    
    # Load data
    briefs = load_briefs()
    client_profile = load_client_profile()
    
    # Skip post #1 (already generated manually)
    briefs_to_generate = [b for b in briefs if b['post_num'] != 1]
    
    print(f"📝 Generating {len(briefs_to_generate)} blog posts...")
    print()
    
    results = []
    
    for i, brief in enumerate(briefs_to_generate, 1):
        print(f"[{i}/{len(briefs_to_generate)}] Generating: {brief['title'][:60]}...")
        
        content = generate_blog_post(brief, client_profile)
        
        if content:
            filepath = save_blog_post(brief, content)
            results.append({
                'title': brief['title'],
                'filepath': filepath,
                'status': 'success',
                'word_count': len(content.split())
            })
            print(f"    ✅ Saved to: {filepath} ({len(content.split())} words)")
        else:
            results.append({
                'title': brief['title'],
                'status': 'failed'
            })
            print(f"    ❌ Failed")
        
        print()
    
    # Summary
    print("=" * 60)
    print("📊 GENERATION SUMMARY")
    print("=" * 60)
    
    successful = [r for r in results if r['status'] == 'success']
    failed = [r for r in results if r['status'] == 'failed']
    
    print(f"✅ Successful: {len(successful)}")
    print(f"❌ Failed: {len(failed)}")
    print(f"📁 Total blog posts: {len(successful) + 1} (including manual post #1)")
    print()
    
    if successful:
        total_words = sum(r['word_count'] for r in successful)
        print(f"📊 Total words generated: {total_words:,}")
        print()
        print("Generated posts:")
        for r in successful:
            print(f"  - {r['title'][:70]}... ({r['word_count']} words)")
    
    if failed:
        print()
        print("⚠️  Failed posts (review manually):")
        for r in failed:
            print(f"  - {r['title']}")
    
    print()
    print("✅ Blog generation complete!")

if __name__ == '__main__':
    main()
