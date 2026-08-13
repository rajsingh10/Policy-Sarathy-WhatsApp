with open('src/pages/Profile.tsx', 'r') as f:
    content = f.read()

# 1. Replace the outer wrappers
content = content.replace(
    '<div className="grid gap-6">\n        <div className="grid grid-cols-12 gap-6 items-stretch">\n          {/* Profile Card */}\n          <div\n            className={`col-span-12 ${UserProfile?.activePackage ? "md:col-span-8" : "md:col-span-12"\n              } flex flex-col`}\n          >',
    '<div className="grid grid-cols-12 gap-6 items-start">\n        {/* Left Column */}\n        <div\n            className={`col-span-12 ${UserProfile?.activePackage ? "md:col-span-8" : "md:col-span-12"\n              } flex flex-col gap-6`}\n          >\n          {/* Profile Card */}'
)

# Remove the closing div of the profile card so left column stays open
content = content.replace('            </Card>\n          </div>\n\n          {/* Package Card */}', '            </Card>\n\n          {/* Package Card */}')


package_card_start = content.find('          {/* Package Card */}')
package_card_end = content.find('        </div>\n\n        {/* Company Details Card */}')

package_card_code = content[package_card_start:package_card_end]

content = content[:package_card_start] + content[package_card_end + 15:]
# Removed `        </div>\n\n` before Company details card. This means Company Details and Password Card are now inside the Left Column.

# Find the end of the Password Card
password_card_end = content.find('        </Card>\n      </div>\n    </div>\n  );\n};')

# Close the left column, insert the Package Card, and close the main grid
new_bottom = '        </Card>\n        </div>\n\n' + package_card_code + '      </div>\n    </div>\n  );\n};'

content = content[:password_card_end] + new_bottom

with open('src/pages/Profile.tsx', 'w') as f:
    f.write(content)

print("Layout fixed")
