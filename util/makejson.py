# need Python 3.6+

import json
import sys
from pathlib import Path
from shutil import copyfile

# the input directory that contains individual song directories
PACK_DIR_PATH = 'RIP11.5'
# the output directory you want your '/banners' and 'data.json'
OUT_DIR_PATH = 'RIP115out'

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

def is_banner_path(fname):
    return fname.lower() == 'bn.png' or fname.replace(' ','').lower().endswith('bn.png') or fname.lower() == 'dead music.png'

def parse_file(path):
    title = None
    subtitle = None
    difficulty = None
    modes = None ## signals which part of tournament is a song available in (Pool, DE, or All)
    isNoCmod = False

    with path.open() as f:
        text = ''.join([line.strip() for line in f if not line.startswith('//')])
        tags = text.split(';')
        for tag in tags:
            if tag.startswith('#TITLE:'):
                title = tag[len('#TITLE:'):].replace('\\:',':')
            elif tag.startswith('#SUBTITLE:'):
                subtitle = tag[len('#SUBTITLE:'):].replace('\\:',':')
            elif tag.startswith('#NOTES:'):
                subtags = tag.split(':')
                if subtags[1] == 'dance-single' and subtags[3] == 'Challenge':
                    try:
                        difficulty = int(subtags[4])
                    except ValueError:
                        pass
    if title is None or subtitle is None or difficulty is None:
        return None
    else:
        if title.startswith(('(DE)', '(Pool)')):
            # this code looks nasty lol -sangyeol
            modes = 'DE' if title.startswith('(DE)') else 'Pool'
            title = title[len('(DE) '):] if title.startswith('(DE)') else title[len('(Pool) '):]
        else:
            modes = 'All' ## song available in both Pool and DE
        if title.lower().endswith('(no cmod)'):
            title = title[:-len('(no cmod) ')]
            isNoCmod = True
        return {'title': title, 'subtitle': subtitle, 'difficulty': difficulty, 'modes': modes, 'is_no_cmod': isNoCmod}

def handle_song_dir(pack_dir_path, out_dir_path):
    # Search the pack directory. Each directory should contain one banner file
    # and one .sm file with proper data.
    song_attrs = []
    song_dirs = [d for d in pack_dir_path.iterdir() if d.is_dir()]
    for song_dir in song_dirs:
        # Find -bn.png file
        song_bn_path = [f for f in song_dir.iterdir() if f.is_file() and is_banner_path(f.name)]
        if len(song_bn_path) != 1:
            eprint('SONG %s DOES NOT HAVE EXACTLY ONE -bn.png FILE' % song_dir.name)
            continue
        
        # Find .sm file
        song_sm_path = [f for f in song_dir.iterdir() if f.is_file() and f.suffix == '.sm']
        if len(song_sm_path) != 1:
            eprint('SONG %s DOES NOT HAVE EXACTLY ONE .sm FILE' % song_dir.name)
            continue
        parsed_data = parse_file(song_sm_path[0])
        if parsed_data is None:
            eprint('SONG %s DOES NOT HAVE PROPER DATA IN .sm FILE' % song_dir.name)
            continue
        song_attrs.append((parsed_data, song_bn_path[0]))

    bn_filenames = set()
    output_list = []
    for song_attr, bn_path in song_attrs:
        decollisioned_bn_filename = bn_path.name
        decollision_i = 0
        while decollisioned_bn_filename in bn_filenames:
            decollisioned_bn_filename = bn_path.stem + str(decollision_i) + bn_path.suffix
            decollision_i += 1
        bn_filenames.add(decollisioned_bn_filename)
        copyfile(bn_path, out_dir_path / 'banners' / decollisioned_bn_filename)
        song_attr['banner_filename'] = decollisioned_bn_filename
        output_list.append(song_attr)
    
    out_dir_data_path = out_dir_path / 'data.json'
    with open(out_dir_data_path, 'w') as f:
        f.write(json.dumps(output_list, indent=4))


def main():
    pack_dir_path = Path(PACK_DIR_PATH)
    if not pack_dir_path.exists():
        eprint('CANNOT FIND PACK DIRECTORY')
        return
    out_dir_path = Path(OUT_DIR_PATH)
    if not out_dir_path.exists():
        out_dir_path.mkdir(parents=True)
    out_dir_banner_path = out_dir_path / 'banners'
    if not out_dir_banner_path.exists():
        out_dir_banner_path.mkdir()
    handle_song_dir(pack_dir_path, out_dir_path)


main()
