# need Python 3.6+

import json
import sys
from pathlib import Path
from shutil import copyfile

# the input directory that contains individual song directories
PACK_DIR_PATH = 'rip115couples'
# the output directory you want your 'data.json'
OUT_DIR_PATH = 'couples_out'

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

def parse_file(path):
    title = None
    subtitle = None
    difficulty = None

    with path.open() as f:
        text = ''.join([line.strip() for line in f if not line.startswith('//')])
        tags = text.split(';')
        for tagx in tags:
            tag = tagx.strip('\uFEFF')
            if tag.startswith('#TITLE:'):
                title = tag[len('#TITLE:'):].replace('\\:',':')
            elif tag.startswith('#SUBTITLE:'):
                subtitle = tag[len('#SUBTITLE:'):].replace('\\:',':')
            elif tag.startswith('#NOTES:'):
                subtags = tag.split(':')
                if subtags[1] == 'dance-double' and subtags[3] == 'Challenge':
                    try:
                        difficulty = int(subtags[4])
                    except ValueError:
                        pass
    if title is None or subtitle is None or difficulty is None:
        return None
    else:
        return {'title': title, 'subtitle': subtitle, 'difficulty': difficulty}

def handle_song_dir(pack_dir_path, out_dir_path):
    # Search the pack directory. Each directory should contain one banner file
    # and one .sm file with proper data.
    song_attrs = []
    song_dirs = [d for d in pack_dir_path.iterdir() if d.is_dir()]
    for song_dir in song_dirs:
        # Find .sm file
        song_sm_path = [f for f in song_dir.iterdir() if f.is_file() and f.suffix == '.sm']
        if len(song_sm_path) != 1:
            eprint('SONG %s DOES NOT HAVE EXACTLY ONE .sm FILE' % song_dir.name)
            continue
        parsed_data = parse_file(song_sm_path[0])
        if parsed_data is None:
            eprint('SONG %s DOES NOT HAVE PROPER DATA IN .sm FILE' % song_dir.name)
            continue
        song_attrs.append(parsed_data)

    out_dir_data_path = out_dir_path / 'data.json'
    with open(out_dir_data_path, 'w') as f:
        f.write(json.dumps(song_attrs, indent=4))


def main():
    pack_dir_path = Path(PACK_DIR_PATH)
    if not pack_dir_path.exists():
        eprint('CANNOT FIND PACK DIRECTORY')
        return
    out_dir_path = Path(OUT_DIR_PATH)
    if not out_dir_path.exists():
        out_dir_path.mkdir(parents=True)
    handle_song_dir(pack_dir_path, out_dir_path)


main()
