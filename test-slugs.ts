import { getAllSlugs } from './next-app/src/lib/markdown';

async function test() {
    console.log('CN Slugs:', getAllSlugs('cn'));
    console.log('EN Slugs:', getAllSlugs('en'));
}

test();
