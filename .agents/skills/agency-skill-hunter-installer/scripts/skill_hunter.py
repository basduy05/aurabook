import os
import sys
import re
import argparse
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

GLOBAL_SKILLS_DIR = Path.home() / '.gemini' / 'config' / 'skills'
LOCAL_SKILLS_DIR = Path.cwd() / '.agents' / 'skills'

def audit_skills():
    target_dirs = [GLOBAL_SKILLS_DIR, LOCAL_SKILLS_DIR]
    print('=' * 60)
    print('[AUDIT] HE THONG KY NANG ANTIGRAVITY')
    print('=' * 60)
    
    total = 0
    for s_dir in target_dirs:
        if not s_dir.exists():
            continue
        skills = [d for d in s_dir.iterdir() if d.is_dir() and (d / 'SKILL.md').exists()]
        print('Thu muc: ' + str(s_dir))
        print('   So luong skills hop le: ' + str(len(skills)))
        total += len(skills)
        
    print('-' * 60)
    print('TONG CONG HE THONG DANG CO: ' + str(total) + ' KY NANG KHA DUNG.')
    print('=' * 60)

def install_custom_skill(name: str, description: str, body: str, is_global: bool = True):
    dest_root = GLOBAL_SKILLS_DIR if is_global else LOCAL_SKILLS_DIR
    clean_name = re.sub(r'[^a-zA-Z0-9_-]', '-', name).lower().strip('-')
    target_dir = dest_root / clean_name
    target_dir.mkdir(parents=True, exist_ok=True)
    
    skill_file = target_dir / 'SKILL.md'
    header = '---\nname: ' + clean_name + '\ndescription: "' + description + '"\n---\n\n'
    content = header + body.strip() + '\n'
    with open(skill_file, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print('Da cai dat thanh cong skill ' + clean_name + ' vao: ' + str(skill_file))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Skill Hunter & Installer CLI')
    subparsers = parser.add_subparsers(dest='command')
    subparsers.add_parser('audit', help='Audit installed skills')
    install_parser = subparsers.add_parser('install', help='Install a new skill')
    install_parser.add_argument('--name', required=True, help='Skill name')
    install_parser.add_argument('--description', required=True, help='Skill description')
    install_parser.add_argument('--body', default='', help='Skill markdown body')
    install_parser.add_argument('--global-install', action='store_true', default=True, help='Install to global config')
    
    args = parser.parse_args()
    if args.command == 'audit' or not args.command:
        audit_skills()
    elif args.command == 'install':
        install_custom_skill(args.name, args.description, args.body, args.global_install)
