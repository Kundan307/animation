import re

svg_content = open('public/truck.svg', 'r').read()

# Front wheel paths
front_pattern = r'(<path class="cls-1" d="M142\.67.*?M170\.81.*?Z"/>)'
svg_content = re.sub(front_pattern, r'<g className="wheel" style={{transformOrigin: "center", transformBox: "fill-box"}}>\1</g>', svg_content, flags=re.DOTALL)

# Rear left wheel paths
rl_pattern = r'(<path class="cls-1" d="M883\.52.*?M822\.46.*?Z"/>)'
svg_content = re.sub(rl_pattern, r'<g className="wheel" style={{transformOrigin: "center", transformBox: "fill-box"}}>\1</g>', svg_content, flags=re.DOTALL)

# Rear right wheel paths
rr_pattern = r'(<path class="cls-1" d="M964\.55.*?M992\.68.*?Z"/>)'
svg_content = re.sub(rr_pattern, r'<g className="wheel" style={{transformOrigin: "center", transformBox: "fill-box"}}>\1</g>', svg_content, flags=re.DOTALL)

# Reactify
svg_content = svg_content.replace('xmlns:xlink=', 'xmlnsXlink=')
svg_content = svg_content.replace('class=', 'className=')

# We need to wrap in a React component
out = "export default function Truck(props: React.SVGProps<SVGSVGElement>) {\n"
out += f"  return (\n    {svg_content.replace('<svg ', '<svg {...props} ')}\n  );\n"
out += "}\n"

with open('src/components/Truck.tsx', 'w') as f:
    f.write(out)

